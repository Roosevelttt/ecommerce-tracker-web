import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ddb, TABLES } from "@/lib/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        try {
          await ddb.send(
            new PutCommand({
              TableName: TABLES.USERS,
              Item: {
                user_id: user.email,
                email: user.email,
                last_login: new Date().toISOString(),
              },
            })
          );
        } catch (error) {
          console.error("Error syncing user to DynamoDB:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        session.user.image = session.user.email;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };