import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Alertas from "./pages/Alertas.tsx";
import { Tendencias, SalaSituacao, Indicadores, Execucao, GovernancaDigital, Metodologia } from "./pages/StubPages.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/tendencias" element={<Tendencias />} />
          <Route path="/sala-situacao" element={<SalaSituacao />} />
          <Route path="/indicadores" element={<Indicadores />} />
          <Route path="/execucao" element={<Execucao />} />
          <Route path="/governanca-digital" element={<GovernancaDigital />} />
          <Route path="/metodologia" element={<Metodologia />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
