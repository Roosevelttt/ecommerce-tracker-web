import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { ddb, TABLES } from "@/lib/dynamodb";
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();

  if (!url.includes("amazon.com")) {
    return NextResponse.json({ error: "Only Amazon URLs are supported" }, { status: 400 });
  }

  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLES.PRODUCTS,
        Item: {
          product_url: url,
          user_id: session.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_price: null,
          in_stock: true,
        },
      })
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await ddb.send(
      new QueryCommand({
        TableName: TABLES.PRODUCTS,
        IndexName: 'UserProductsIndex',
        KeyConditionExpression: 'user_id = :email',
        ExpressionAttributeValues: {
          ':email': session.user.email,
        },
        ScanIndexForward: false, 
      })
    );
    return NextResponse.json(data.Items || []);
  } catch (error) {
    console.error("DynamoDB Query Error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    const { url } = await req.json();
    
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await ddb.send(new DeleteCommand({
            TableName: TABLES.PRODUCTS,
            Key: { product_url: url }
        }));
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}