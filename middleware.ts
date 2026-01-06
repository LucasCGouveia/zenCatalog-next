import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = { 
  // ADICIONADO: '|cadastro' na lista de exceções
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|cadastro).*)",
  ] 
};