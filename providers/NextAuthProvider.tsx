"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";

export const NextAuthProvider = ({ children }: { children: ReactNode }) => {
  // const [mounted, setMounted] = useState(false);

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  // // Impede que o SessionProvider tente rodar no servidor durante o build
  // if (!mounted) {
  //   return <>{children}</>;
  // }

  return <SessionProvider>{children}</SessionProvider>;
};