import { useEffect, useState } from "react";
import { fetchFinanceiroMensal } from "@/services/financeiro";

export default function Dashboard() {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const resultado = await fetchFinanceiroMensal();
        setDados(resultado || []);
      } catch (err) {
        setErro("Erro ao carregar dados do Supabase");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (erro) return <div>{erro}</div>;

  return (
    <div>
      <h1>Financeiro Mensal</h1>

      {dados.map((item, index) => (
        <div key={index}>
          <p>Ano: {item.ano}</p>
          <p>Mês: {item.mes_num}</p>
          <p>Receita: {item.receita_total}</p>
          <p>Despesa Empenhada: {item.despesa_empenhada}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}