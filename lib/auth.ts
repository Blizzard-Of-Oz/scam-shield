import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { upsertUserByEmail } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      upsertUserByEmail({
        email: user.email,
        name: user.name,
        image: user.image,
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = upsertUserByEmail({
          email: user.email,
          name: user.name,
          image: user.image,
        });

        token.sub = dbUser.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
};
