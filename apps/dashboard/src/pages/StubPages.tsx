import { AppLayout } from "@/components/layout/AppLayout";
import { Construction } from "lucide-react";

interface StubPageProps {
  title: string;
  description: string;
}

function StubPage({ title, description }: StubPageProps) {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <Construction className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">Módulo em desenvolvimento.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Dados serão integrados na próxima versão.</p>
        </div>
      </div>
    </AppLayout>
  );
}

export function Tendencias() {
  return <StubPage title="Tendências Financeiras" description="Análise de séries históricas e projeções de arrecadação e gasto." />;
}

export function SalaSituacao() {
  return <StubPage title="Sala de Situação" description="Painel em tempo real para acompanhamento de eventos críticos." />;
}

export function Indicadores() {
  return <StubPage title="Indicadores Estratégicos" description="Indicadores-chave de desempenho alinhados ao PPA e LDO." />;
}

export function Execucao() {
  return <StubPage title="Execução Orçamentária" description="Acompanhamento detalhado da execução por função, subfunção e secretaria." />;
}

export function GovernancaDigital() {
  return <StubPage title="Governança Digital" description="Indicadores de maturidade digital, projetos de TI e inovação." />;
}

export function Metodologia() {
  return <StubPage title="Metodologia" description="Governança dos dados: fontes, periodicidade, validações e responsáveis." />;
}
