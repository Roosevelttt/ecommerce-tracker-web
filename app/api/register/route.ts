import { NextResponse } from "next/server";
import { ddb, TABLES } from "@/lib/dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existingUser = await ddb.send(
      new GetCommand({
        TableName: TABLES.USERS,
        Key: { user_id: email },
      })
    );

    if (existingUser.Item) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await ddb.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: {
          user_id: email,
          email: email,
          password: hashedPassword,
          created_at: new Date().toISOString(),
          is_subscribed: false,
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}