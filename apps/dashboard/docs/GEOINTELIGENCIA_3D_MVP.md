# Boituva GeoInteligência 3D — MVP 0.1

## Objetivo

Adicionar ao Boituva Digital uma primeira experiência de mapa municipal 3D no estilo Cidade Digital / Smart City, sem alterar o painel executivo existente.

## Acesso

Rota: `/geointeligencia`

Branch: `feature/geointeligencia-3d-mvp`

## Stack do MVP

- React + TypeScript + Vite (estrutura existente)
- MapLibre GL JS para renderização WebGL, navegação, terreno e edifícios extrudados
- OpenFreeMap para estilo e tiles vetoriais
- OpenStreetMap como fonte comunitária de geometrias e atributos de edifícios
- Mapterhorn como fonte de elevação usada na demonstração inicial

## Executar localmente

Na pasta `apps/dashboard`:

```bash
npm install
npm run dev
```

Abrir `http://localhost:8080/geointeligencia`.

## Funcionalidades incluídas

- Mapa escuro centralizado em Boituva/SP
- Câmera inclinada com rotação e controles de navegação
- Edifícios extrudados a partir de atributos vetoriais disponíveis
- Terreno 3D e hillshade
- Controles para ativar/desativar construções e relevo
- Ações para recentralizar, alternar 2D/3D e tela cheia
- Rota independente do cockpit executivo

## Limitações conhecidas

1. O volume e a altura das construções dependem da cobertura e qualidade dos dados do OpenStreetMap. Alturas ausentes recebem uma extrusão visual aproximada de 8 m; isso não representa medição cadastral.
2. O relevo e os tiles são consumidos de serviços públicos externos. Eles são adequados para prototipação, mas não constituem infraestrutura municipal com SLA.
3. A primeira versão não carrega ainda o limite oficial do município, setores censitários, escolas, unidades de saúde ou Carta de Serviços.
4. Não há ainda API própria nem banco PostGIS conectado ao mapa.
5. A visualização não deve ser usada para decisões cadastrais, tributárias ou de engenharia sem validação das fontes oficiais.

## Próximas etapas

1. Obter e validar o polígono oficial do limite municipal e dos setores censitários do IBGE.
2. Importar equipamentos públicos e departamentos, geocodificando e validando endereços.
3. Transformar a Carta de Serviços em tabelas normalizadas de serviços, departamentos e canais.
4. Criar camadas GeoJSON e filtros por secretaria, categoria e canal de atendimento.
5. Implementar mapas coropléticos e heatmaps com denominadores e metadados de atualização.
6. Planejar PostGIS e API geoespacial para dados municipais e consultas espaciais.
7. Avaliar hospedagem própria de tiles/DEM e política de atualização para produção.

## Governança e atribuição

- Manter atribuição visível aos provedores de dados cartográficos e aos colaboradores do OpenStreetMap.
- Registrar fonte, data de extração, data de validação, responsável e qualidade para cada camada municipal.
- Não publicar dados pessoais, dados tributários individualizados ou informações protegidas.
- Distinguir visualmente dados oficiais, dados comunitários e estimativas.

## Referências técnicas

- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/
- Exemplo de terreno 3D: https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/
- Exemplo de edifícios 3D: https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/
- OpenFreeMap: https://openfreemap.org/quick_start/
- OpenStreetMap — atributos 3D: https://wiki.openstreetmap.org/wiki/Simple_3D_Buildings
