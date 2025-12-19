import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { ddb, TABLES } from "@/lib/dynamodb";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const userRecord = await ddb.send(
          new GetCommand({
            TableName: TABLES.USERS,
            Key: { user_id: credentials.email },
          })
        );

        const user = userRecord.Item;

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) return null;

        return { id: user.user_id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
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
  pages: {
    signIn: '/dashboard',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };