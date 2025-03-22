//api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      user_id?: string | null;
    };
  }

  interface JWT {
    user_id?: string | null;
    role?: string | null;
  }
}

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        // Check if the user already exists in the database
        const checkResponse = await fetch(`http://localhost:3000/api/users?email=${user.email}`, {
          method: "GET",
        });

        let userData;
        if (checkResponse.ok) {
          userData = await checkResponse.json();
        } else if (checkResponse.status === 404) {
          // If user does not exist, create a new user
          const createResponse = await fetch("http://localhost:3000/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: user.name || user.email, // Use Google name or email as username
              email: user.email, // Google email
              role: "user", // Default role
            }),
          });

          if (!createResponse.ok) {
            console.error("Failed to create user:", await createResponse.text());
            return false; // Deny sign-in if user creation fails
          }

          userData = await createResponse.json(); // Get the new user data
        } else {
          console.error("Error checking user existence:", await checkResponse.text());
          return false; // Deny sign-in if the check fails
        }

        // Attach user_id from database to token
        user.id = userData.id; // Set user_id properly

        return true; // Allow sign-in
      } catch (error) {
        console.error("Error during sign-in:", error);
        return false; // Deny sign-in on error
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.role = "user"; // Fetch role if needed
        token.user_id = user.id; // Store the user_id from the database, NOT Google ID
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.user_id = token.user_id as string; // Attach the correct user_id
      }
      return session;
    },
  },
});
