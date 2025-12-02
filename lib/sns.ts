import { SNSClient, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";

export const sns = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!,
  },
});

export const TOPICS = {
  PRICE_DROP: process.env.SNS_PRICE_DROP_TOPIC_ARN,
  STOCK_RESTOCK: process.env.SNS_STOCK_RESTOCK_TOPIC_ARN,
};

export async function getSubscriptionStatus(email: string) {
  if (!TOPICS.PRICE_DROP) return 'NONE';

  try {
    const command = new ListSubscriptionsByTopicCommand({
      TopicArn: TOPICS.PRICE_DROP,
    });
    const response = await sns.send(command);
    
    const sub = response.Subscriptions?.find(s => s.Endpoint === email);
    
    if (!sub) return 'NONE';
    if (sub.SubscriptionArn === 'PendingConfirmation') return 'PENDING';
    return 'CONFIRMED';
  } catch (error) {
    console.error("Error checking SNS status:", error);
    return 'NONE';
  }
}