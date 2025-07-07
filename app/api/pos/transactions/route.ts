import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// Helper function to get user from middleware headers
async function getUserFromRequest(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const username = request.headers.get("x-username");

    if (!userId || !userRole || !username) {
      return null;
    }

    // Get user details from database to ensure user is still active
    const userResult = await executeQuery(
      `SELECT id, username, email, full_name, role, is_active 
       FROM users WHERE id = ? AND is_active = 1`,
      [parseInt(userId)]
    );

    if (
      !userResult.success ||
      !Array.isArray(userResult.data) ||
      userResult.data.length === 0
    ) {
      return null;
    }

    return userResult.data[0] as any;
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

// POST - Create POS transaction
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customer_id, payment_method, paid_amount, items } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Items required" },
        { status: 400 }
      );
    }

    if (
      !payment_method ||
      !["cash", "card", "bank_transfer"].includes(payment_method)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Calculate total from items
    const total = items.reduce((sum: number, item: any) => sum + item.total, 0);

    // Validate payment amount for cash payments
    if (payment_method === "cash" && paid_amount < total) {
      return NextResponse.json(
        { success: false, message: "Insufficient payment amount" },
        { status: 400 }
      );
    }

    // Validate stock availability
    for (const item of items) {
      const stockResult = await executeQuery(
        `SELECT quantity FROM items WHERE id = ? AND is_active = true`,
        [item.item_id]
      );

      if (
        !stockResult.success ||
        !Array.isArray(stockResult.data) ||
        stockResult.data.length === 0
      ) {
        return NextResponse.json(
          { success: false, message: `Item with ID ${item.item_id} not found` },
          { status: 400 }
        );
      }

      const currentStock = (stockResult.data[0] as any).quantity;
      if (currentStock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for item ID ${item.item_id}`,
          },
          { status: 400 }
        );
      }
    }

    // Generate transaction number
    const transactionNumber = `POS-${Date.now()}`;

    // Create transaction record
    const transactionResult = await executeQuery(
      `INSERT INTO pos_transactions (
        transaction_number, customer_id, user_id, payment_method, 
        total_amount, paid_amount, change_amount, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionNumber,
        customer_id || null,
        user.id,
        payment_method,
        total,
        paid_amount || total,
        payment_method === "cash" ? paid_amount - total : 0,
        "completed",
      ]
    );

    if (!transactionResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to create transaction" },
        { status: 500 }
      );
    }

    // Get transaction ID - MySQL returns insertId in the result
    const transactionId = (transactionResult.data as any).insertId;

    // Process each item
    const processedItems = [];
    for (const item of items) {
      // Add transaction item
      const itemResult = await executeQuery(
        `INSERT INTO pos_transaction_items (
          transaction_id, item_id, quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?)`,
        [transactionId, item.item_id, item.quantity, item.price, item.total]
      );

      if (!itemResult.success) {
        return NextResponse.json(
          { success: false, message: "Failed to add transaction item" },
          { status: 500 }
        );
      }

      // Update item stock
      const updateStockResult = await executeQuery(
        `UPDATE items SET quantity = quantity - ? WHERE id = ?`,
        [item.quantity, item.item_id]
      );

      if (!updateStockResult.success) {
        return NextResponse.json(
          { success: false, message: "Failed to update stock" },
          { status: 500 }
        );
      }

      // Get item details for receipt
      const itemDetailsResult = await executeQuery(
        `SELECT name, code FROM items WHERE id = ?`,
        [item.item_id]
      );

      if (
        itemDetailsResult.success &&
        Array.isArray(itemDetailsResult.data) &&
        itemDetailsResult.data.length > 0
      ) {
        const itemDetails = itemDetailsResult.data[0] as any;
        processedItems.push({
          name: itemDetails.name,
          code: itemDetails.code,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        });

        // Log stock transaction
        await executeQuery(
          `INSERT INTO stock_logs (
            item_id, user_id, type, transaction_type, quantity, previous_stock, current_stock, 
            notes, reference_no
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.item_id,
            user.id,
            "out",
            "pos",
            item.quantity,
            0, // We'll calculate this if needed
            0, // We'll calculate this if needed
            `POS Sale - ${transactionNumber}`,
            transactionNumber,
          ]
        );
      }
    }

    // Create receipt data
    const receipt = {
      transaction_number: transactionNumber,
      date: new Date(),
      items: processedItems,
      total: total,
      paid_amount: paid_amount || total,
      change: payment_method === "cash" ? paid_amount - total : 0,
      payment_method: payment_method,
    };

    return NextResponse.json({
      success: true,
      message: "Transaction completed successfully",
      data: {
        transaction_id: transactionId,
        transaction_number: transactionNumber,
        total: total,
        paid_amount: paid_amount || total,
        change: payment_method === "cash" ? paid_amount - total : 0,
        receipt: receipt,
      },
    });
  } catch (error) {
    console.error("POS Transaction error:", error);
    return NextResponse.json(
      { success: false, message: "Server error occurred" },
      { status: 500 }
    );
  }
}

// GET - Get POS transactions
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Get transactions with customer info
    const transactionsResult = await executeQuery(
      `SELECT 
        pt.id, pt.transaction_number, pt.customer_id, pt.user_id,
        pt.payment_method, pt.total_amount, pt.paid_amount, pt.change_amount,
        pt.status, pt.created_at,
        c.name as customer_name, c.email as customer_email,
        u.username as cashier_name
      FROM pos_transactions pt
      LEFT JOIN customers c ON pt.customer_id = c.id
      LEFT JOIN users u ON pt.user_id = u.id
      ORDER BY pt.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const transactions =
      transactionsResult.success && Array.isArray(transactionsResult.data)
        ? transactionsResult.data
        : [];

    // Get total count
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM pos_transactions`
    );
    const total =
      countResult.success &&
      Array.isArray(countResult.data) &&
      countResult.data.length > 0
        ? (countResult.data[0] as any).total
        : 0;

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get POS transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Server error occurred" },
      { status: 500 }
    );
  }
}
