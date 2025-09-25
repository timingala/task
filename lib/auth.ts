import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Direct API call function for server-side
async function loginUser(username: string, password: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://maestro-api-dev.secil.biz';
    
    console.log('Attempting login to:', apiUrl);
    
    const response = await fetch(`${apiUrl}/Auth/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.status === 0 && data.data) {
      return {
        id: username,
        email: username,
        name: "User",
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresIn: data.data.expiresIn
      };
    }
  } catch (error) {
    console.error('Login error:', error);
  }
  
  return null;
}

export const authConfig: NextAuthConfig = {
  // CRITICAL: Trust the host in production
  trustHost: true,
  
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await loginUser(
          credentials.username as string,
          credentials.password as string
        );
        
        return user;
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/collections') || 
                           nextUrl.pathname.startsWith('/edit');
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/collections', nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.expiresIn = (user as any).expiresIn;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "your-super-secret-key-please-change-in-production-2024",
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);