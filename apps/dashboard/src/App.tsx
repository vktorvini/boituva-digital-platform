import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExecutiveFiltersProvider } from "@/contexts/ExecutiveFiltersContext";
import Index from "./pages/Index.tsx";
import Execucao from "./pages/Execucao.tsx";
import IbgeMunicipio from "./pages/IbgeMunicipio.tsx";
import ComparativoRegional from "./pages/ComparativoRegional.tsx";
import OperacionalEleitorado from "./pages/OperacionalEleitorado.tsx";
import OperacionalContratos from "./pages/OperacionalContratos.tsx";
import OperacionalFiscal from "./pages/OperacionalFiscal.tsx";
import IegmScorecard from "./pages/IegmScorecard.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ExecutiveFiltersProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/execucao" element={<Execucao />} />
            <Route path="/receita" element={<Navigate to="/execucao" replace />} />
            <Route path="/despesa" element={<Navigate to="/execucao" replace />} />
            <Route path="/ibge-municipio" element={<IbgeMunicipio />} />
            <Route path="/operacional/eleitorado" element={<OperacionalEleitorado />} />
            <Route path="/operacional/contratos" element={<OperacionalContratos />} />
            <Route path="/operacional/fiscal" element={<OperacionalFiscal />} />
            <Route path="/painel/iegm-scorecard" element={<IegmScorecard />} />
            <Route path="/comparativo-regional" element={<ComparativoRegional />} />
            <Route path="/fontes/pncp" element={<Navigate to="/operacional/contratos" replace />} />
            <Route path="/fontes/siconfi" element={<Navigate to="/operacional/fiscal" replace />} />
            <Route path="/fontes/tse" element={<Navigate to="/operacional/eleitorado" replace />} />
            <Route path="/fontes/tcesp-iegm" element={<Navigate to="/painel/iegm-scorecard" replace />} />
            <Route path="/fontes/ibge-sidra" element={<Navigate to="/ibge-municipio" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ExecutiveFiltersProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
