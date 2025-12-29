import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = { 
  // O segredo está no matcher: ele deve proteger a home, 
  // mas NÃO pode incluir a rota /login
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ] 
};