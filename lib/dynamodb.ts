import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!,
  },
});

export const ddb = DynamoDBDocumentClient.from(client);
export const TABLES = {
  PRODUCTS: process.env.PRODUCTS_TABLE || "Products",
  USERS: process.env.USERS_TABLE || "Users",
};