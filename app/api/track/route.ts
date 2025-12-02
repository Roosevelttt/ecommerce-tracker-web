import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { ddb, TABLES } from "@/lib/dynamodb";
import { sns, TOPICS, getSubscriptionStatus } from "@/lib/sns";
import { PutCommand, QueryCommand, DeleteCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SubscribeCommand } from "@aws-sdk/client-sns";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url.includes("amazon.com")) {
    return NextResponse.json({ error: "Only Amazon URLs are supported" }, { status: 400 });
  }

  try {
    const userEmail = session.user.email;
    const status = await getSubscriptionStatus(userEmail);
    let requiresConfirmation = false;

    if (status === 'NONE') {
        console.log(`Subscribing ${userEmail}...`);
        
        if (TOPICS.PRICE_DROP) {
            await sns.send(new SubscribeCommand({ Protocol: 'email', TopicArn: TOPICS.PRICE_DROP, Endpoint: userEmail }));
        }
        if (TOPICS.STOCK_RESTOCK) {
            await sns.send(new SubscribeCommand({ Protocol: 'email', TopicArn: TOPICS.STOCK_RESTOCK, Endpoint: userEmail }));
        }
        
        requiresConfirmation = true;
    } 
    else if (status === 'PENDING') {
        requiresConfirmation = true; 
    } 
    else if (status === 'CONFIRMED') {
        await ddb.send(new UpdateCommand({
            TableName: TABLES.USERS,
            Key: { user_id: userEmail },
            UpdateExpression: "set is_subscribed = :true",
            ExpressionAttributeValues: { ":true": true }
        }));
    }

    await ddb.send(
      new PutCommand({
        TableName: TABLES.PRODUCTS,
        Item: {
          product_url: url,
          user_id: userEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_price: null,
          in_stock: true,
        },
      })
    );

    return NextResponse.json({ success: true, requiresConfirmation });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userEmail = session.user.email;

  try {
    const userRecord = await ddb.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { user_id: userEmail }
    }));

    if (!userRecord.Item?.is_subscribed) {
       const status = await getSubscriptionStatus(userEmail);
       
       if (status === 'CONFIRMED') {
         console.log("User confirmed email! Updating DB...");
         await ddb.send(new UpdateCommand({
            TableName: TABLES.USERS,
            Key: { user_id: userEmail },
            UpdateExpression: "set is_subscribed = :true",
            ExpressionAttributeValues: { ":true": true }
         }));
       }
    }

    const data = await ddb.send(
      new QueryCommand({
        TableName: TABLES.PRODUCTS,
        IndexName: 'UserProductsIndex',
        KeyConditionExpression: 'user_id = :email',
        ExpressionAttributeValues: {
          ':email': userEmail,
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