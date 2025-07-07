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

// GET - Get customer's cart
export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromToken(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get cart items with item details (MySQL2 compatible)
    const cartItemsResult = await executeQuery(
      `
      SELECT 
        c.id as cart_id,
        c.quantity as cart_quantity,
        c.price as cart_price,
        i.id as item_id,
        i.code,
        i.name,
        i.description,
        i.unit,
        i.price as online_price,
        i.quantity as stock_quantity,
        i.min_stock as min_order_qty,
        cat.name as category_name
      FROM carts c
      JOIN items i ON c.item_id = i.id
      LEFT JOIN categories cat ON i.category_id = cat.id
      WHERE c.customer_id = ? AND i.is_active = 1 AND i.quantity > 0
      ORDER BY c.created_at DESC
    `,
      [customer.customerId]
    );

    const cartItems = cartItemsResult.success
      ? (cartItemsResult.data as any[])
      : [];

    // Calculate totals with NaN protection
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const price = parseFloat(item.cart_price) || 0;
      const quantity = parseInt(item.cart_quantity) || 0;
      return sum + price * quantity;
    }, 0);
    const totalItems = cartItems.reduce((sum: number, item: any) => {
      const quantity = parseInt(item.cart_quantity) || 0;
      return sum + quantity;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        items: cartItems,
        totals: {
          subtotal,
          totalItems,
          shipping: 0, // Can be calculated based on location/weight
          tax: 0, // Can be calculated as percentage
          total: subtotal,
        },
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerFromToken(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { item_id, quantity = 1 } = body;

    if (!item_id || quantity <= 0) {
      return NextResponse.json(
        { success: false, message: "Item ID dan quantity harus valid" },
        { status: 400 }
      );
    }

    // Check if item exists and available (MySQL2 compatible)
    const itemResult = await executeQuery(
      `
      SELECT id, name, price as online_price, quantity, min_stock as min_order_qty, is_active as is_available_online
      FROM items 
      WHERE id = ?
    `,
      [item_id]
    );

    const item =
      itemResult.success && (itemResult.data as any[]).length > 0
        ? (itemResult.data as any[])[0]
        : null;

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Item tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!item.is_available_online) {
      return NextResponse.json(
        {
          success: false,
          message: "Item tidak tersedia untuk pembelian online",
        },
        { status: 400 }
      );
    }

    if (item.quantity < quantity) {
      return NextResponse.json(
        {
          success: false,
          message: `Stok tidak mencukupi. Tersedia: ${item.quantity}`,
        },
        { status: 400 }
      );
    }

    // Minimum order quantity validation removed as per user request

    // Check if item already in cart
    const existingCartResult = await executeQuery(
      `
      SELECT id, quantity FROM carts 
      WHERE customer_id = ? AND item_id = ?
    `,
      [customer.customerId, item_id]
    );

    const existingCart =
      existingCartResult.success &&
      (existingCartResult.data as any[]).length > 0
        ? (existingCartResult.data as any[])[0]
        : null;

    if (existingCart) {
      // Update existing cart item
      const newQuantity = existingCart.quantity + quantity;

      if (newQuantity > item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Total quantity melebihi stok. Tersedia: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      const safePrice = parseFloat(item.online_price) || 0;
      await executeQuery(
        `
        UPDATE carts 
        SET quantity = ?, price = ?, updated_at = NOW()
        WHERE id = ?
      `,
        [newQuantity, safePrice, existingCart.id]
      );
    } else {
      // Add new cart item
      const safePrice = parseFloat(item.online_price) || 0;
      await executeQuery(
        `
        INSERT INTO carts (customer_id, item_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `,
        [customer.customerId, item_id, quantity, safePrice]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item berhasil ditambahkan ke keranjang",
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const customer = await getCustomerFromToken(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { cart_id, quantity } = await request.json();

    if (!cart_id || quantity < 0) {
      return NextResponse.json(
        { success: false, message: "Cart ID dan quantity harus valid" },
        { status: 400 }
      );
    }

    // Verify cart item belongs to customer
    const cartItemResult = await executeQuery(
      `
      SELECT c.id, c.item_id, i.quantity as stock_quantity, i.min_stock as min_order_qty
      FROM carts c
      JOIN items i ON c.item_id = i.id
      WHERE c.id = ? AND c.customer_id = ?
    `,
      [cart_id, customer.customerId]
    );

    const cartItem =
      cartItemResult.success && (cartItemResult.data as any[]).length > 0
        ? (cartItemResult.data as any[])[0]
        : null;

    if (!cartItem) {
      return NextResponse.json(
        { success: false, message: "Cart item tidak ditemukan" },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      // Remove item from cart
      await executeQuery(`DELETE FROM carts WHERE id = ?`, [cart_id]);
      return NextResponse.json({
        success: true,
        message: "Item dihapus dari keranjang",
      });
    }

    // Validate quantity
    if (quantity > cartItem.stock_quantity) {
      return NextResponse.json(
        {
          success: false,
          message: `Stok tidak mencukupi. Tersedia: ${cartItem.stock_quantity}`,
        },
        { status: 400 }
      );
    }

    // Minimum order quantity validation removed as per user request

    // Update quantity
    await executeQuery(
      `
      UPDATE carts 
      SET quantity = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [quantity, cart_id]
    );

    return NextResponse.json({
      success: true,
      message: "Quantity berhasil diupdate",
    });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const customer = await getCustomerFromToken(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cart_id = searchParams.get("cart_id");

    if (!cart_id) {
      return NextResponse.json(
        { success: false, message: "Cart ID diperlukan" },
        { status: 400 }
      );
    }

    // Verify cart item belongs to customer and delete
    const result = await executeQuery(
      `
      DELETE FROM carts 
      WHERE id = ? AND customer_id = ?
    `,
      [cart_id, customer.customerId]
    );

    if (!result.success || (result.data as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Cart item tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item dihapus dari keranjang",
    });
  } catch (error) {
    console.error("Delete cart error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
