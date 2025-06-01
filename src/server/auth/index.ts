import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";
import { cookies } from "next/headers";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const getSession = async () => {
  const session = await uncachedAuth();

  if (session?.user) {
    return {
      ...session,
      user: {
        ...session.user,
        isGuest: false,
      },
    };
  }

  const guest = (await cookies()).get("guest")?.value;
  if (guest === "guest_user") {
    return {
      user: {
        id: "guest_user",
        name: "Guest",
        email: "guest@example.com",
        image: null,
        isGuest: true,
      },
    };
  }

  return null;
};

export const auth = cache(getSession);

export { handlers, signIn, signOut };