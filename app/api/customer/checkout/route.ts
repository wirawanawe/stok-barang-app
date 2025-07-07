import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { executeQuery } from "@/lib/db";

// Helper function to get customer from token
async function getCustomerFromToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-fallback-secret-key"
    ) as any;
    if (decoded.type !== "customer") {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// POST - Create order from cart
export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerFromToken(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_notes,
      payment_method = "bank_transfer",
      special_instructions,
    } = await request.json();

    // Validate required fields
    if (
      !shipping_name ||
      !shipping_phone ||
      !shipping_address ||
      !shipping_city ||
      !shipping_postal_code
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua field alamat pengiriman harus diisi",
        },
        { status: 400 }
      );
    }

    // Get cart items
    const cartItems = await db.all(
      `
      SELECT 
        c.id as cart_id,
        c.item_id,
        c.quantity,
        c.price,
        i.name,
        i.code,
        i.quantity as stock_quantity,
        i.min_order_qty
      FROM carts c
      JOIN items i ON c.item_id = i.id
      WHERE c.customer_id = ? AND i.is_available_online = 1 AND i.quantity > 0
    `,
      [customer.customerId]
    );

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "Keranjang kosong" },
        { status: 400 }
      );
    }

    // Validate stock availability
    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        return NextResponse.json(
          { success: false, message: `Stok ${item.name} tidak mencukupi` },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping_cost = 0; // Can be calculated based on location/weight
    const tax_amount = 0; // Can be calculated as percentage
    const total_amount = subtotal + shipping_cost + tax_amount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    // Begin transaction
    await db.run("BEGIN TRANSACTION");

    try {
      // Create order
      const orderResult = await db.run(
        `
        INSERT INTO orders (
          order_number,
          customer_id,
          status,
          subtotal,
          shipping_cost,
          tax_amount,
          total_amount,
          shipping_name,
          shipping_phone,
          shipping_address,
          shipping_city,
          shipping_postal_code,
          shipping_notes,
          payment_method,
          payment_status,
          special_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          orderNumber,
          customer.customerId,
          "pending", // Order status
          subtotal,
          shipping_cost,
          tax_amount,
          total_amount,
          shipping_name,
          shipping_phone,
          shipping_address,
          shipping_city,
          shipping_postal_code,
          shipping_notes || null,
          payment_method,
          "pending", // Payment status
          special_instructions || null,
        ]
      );

      const orderId = orderResult.lastID;

      // Create order items and update stock
      for (const item of cartItems) {
        // Add order item
        await db.run(
          `
          INSERT INTO order_items (order_id, item_id, quantity, price, total)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            orderId,
            item.item_id,
            item.quantity,
            item.price,
            item.price * item.quantity,
          ]
        );

        // Update item stock
        await db.run(
          `
          UPDATE items 
          SET quantity = quantity - ?
          WHERE id = ?
        `,
          [item.quantity, item.item_id]
        );

        // Create stock log
        await db.run(
          `
          INSERT INTO stock_logs (item_id, type, quantity, description, created_by)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            item.item_id,
            "out",
            item.quantity,
            `Pesanan online #${orderNumber}`,
            `customer_${customer.customerId}`,
          ]
        );
      }

      // Clear cart
      await db.run(`DELETE FROM carts WHERE customer_id = ?`, [
        customer.customerId,
      ]);

      // Commit transaction
      await db.run("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Pesanan berhasil dibuat",
        data: {
          order_id: orderId,
          order_number: orderNumber,
          total_amount,
          payment_method,
          status: "pending",
        },
      });
    } catch (error) {
      // Rollback transaction
      await db.run("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memproses pesanan" },
      { status: 500 }
    );
  }
}

// GET - Get order details for confirmation
export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromToken(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID diperlukan" },
        { status: 400 }
      );
    }

    // Get order details
    const order = await db.get(
      `
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ? AND o.customer_id = ?
    `,
      [orderId, customer.customerId]
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get order items
    const orderItems = await db.all(
      `
      SELECT 
        oi.*,
        i.name as item_name,
        i.code as item_code,
        i.unit,
        i.description
      FROM order_items oi
      JOIN items i ON oi.item_id = i.id
      WHERE oi.order_id = ?
    `,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      data: {
        order,
        items: orderItems,
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
