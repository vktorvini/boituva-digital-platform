import { Link, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <AppLayout>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="mb-2 text-6xl font-bold text-primary/20">404</p>
        <h1 className="mb-2 text-xl font-bold text-foreground md:text-2xl">Página não encontrada</h1>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          A rota <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{pathname}</code> não existe nesta versão do MVP.
        </p>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </AppLayout>
  );
}
