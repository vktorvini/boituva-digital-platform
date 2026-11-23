import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { ArrowLeft, Building2, Layers3, Map as MapIcon, RotateCcw, Mountain, Navigation, Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import "maplibre-gl/dist/maplibre-gl.css";
import "./GeoInteligencia3D.css";

const BOITUVA_CENTER: [number, number] = [-47.6725, -23.2835];
const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

export default function GeoInteligencia3D() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [buildingsVisible, setBuildingsVisible] = useState(true);
  const [terrainVisible, setTerrainVisible] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: BOITUVA_CENTER,
      zoom: 13.2,
      pitch: 62,
      bearing: -18,
      maxPitch: 78,
      antialias: true,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      try {
        map.addSource("boituva-terrain", {
          type: "raster-dem",
          url: "https://tiles.mapterhorn.com/tilejson.json",
          tileSize: 256,
        });

        map.addLayer({
          id: "boituva-hillshade",
          type: "hillshade",
          source: "boituva-terrain",
          paint: {
            "hillshade-exaggeration": 0.35,
            "hillshade-shadow-color": "#07111f",
            "hillshade-highlight-color": "#8da5bd",
            "hillshade-illumination-direction": 315,
          },
        });

        map.setTerrain({ source: "boituva-terrain", exaggeration: 1.15 });

        map.addSource("boituva-buildings", {
          type: "vector",
          url: "https://tiles.openfreemap.org/planet",
        });

        const firstSymbol = map.getStyle().layers?.find((layer) => layer.type === "symbol")?.id;
        map.addLayer(
          {
            id: "boituva-buildings-3d",
            source: "boituva-buildings",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            filter: ["!=", ["get", "hide_3d"], true],
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["to-number", ["get", "render_height"]], 8],
                0, "#263c55",
                12, "#315b7b",
                35, "#477da0",
                80, "#76a8c6",
              ],
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14, 0,
                15, ["coalesce", ["to-number", ["get", "render_height"]], 8],
              ],
              "fill-extrusion-base": [
                "coalesce",
                ["to-number", ["get", "render_min_height"]],
                0,
              ],
              "fill-extrusion-opacity": 0.88,
              "fill-extrusion-vertical-gradient": true,
            },
          },
          firstSymbol,
        );

        setMapReady(true);
      } catch (error) {
        console.error("Falha ao preparar as camadas 3D:", error);
        setMapError("O mapa carregou, mas algumas camadas 3D não puderam ser inicializadas.");
      }
    });

    map.on("error", (event) => {
      console.error("MapLibre:", event.error);
      setMapError("Não foi possível carregar uma das fontes cartográficas. Verifique a conexão.");
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("boituva-buildings-3d")) return;
    map.setLayoutProperty("boituva-buildings-3d", "visibility", buildingsVisible ? "visible" : "none");
  }, [buildingsVisible, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("boituva-terrain")) return;
    map.setTerrain(terrainVisible ? { source: "boituva-terrain", exaggeration: 1.15 } : null);
    if (map.getLayer("boituva-hillshade")) {
      map.setLayoutProperty("boituva-hillshade", "visibility", terrainVisible ? "visible" : "none");
    }
  }, [terrainVisible, mapReady]);

  const resetCamera = () => {
    mapRef.current?.flyTo({ center: BOITUVA_CENTER, zoom: 13.2, pitch: 62, bearing: -18, duration: 1400 });
  };

  const togglePitch = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ pitch: map.getPitch() > 30 ? 0 : 62, duration: 900 });
  };

  const toggleFullscreen = async () => {
    const element = mapContainer.current?.parentElement;
    if (!element) return;
    if (!document.fullscreenElement) await element.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  return (
    <main className="geo3d-shell">
      <header className="geo3d-topbar">
        <div className="geo3d-brand">
          <div className="geo3d-brand-mark"><MapIcon size={21} /></div>
          <div>
            <p className="geo3d-eyebrow">PREFEITURA DE BOITUVA · INTELIGÊNCIA TERRITORIAL</p>
            <h1>GeoInteligência <span>3D</span></h1>
          </div>
        </div>
        <div className="geo3d-top-actions">
          <span className={`geo3d-status ${mapReady ? "is-ready" : ""}`}>
            <i /> {mapReady ? "MAPA OPERACIONAL" : "CARREGANDO MAPA"}
          </span>
          <Link to="/" className="geo3d-back"><ArrowLeft size={15} /> Voltar ao painel</Link>
        </div>
      </header>

      <section className="geo3d-workspace">
        <aside className="geo3d-sidebar">
          <div className="geo3d-section-heading">
            <Layers3 size={16} />
            <span>CAMADAS DO MAPA</span>
          </div>

          <div className="geo3d-layer-card">
            <div className="geo3d-layer-icon"><Building2 size={17} /></div>
            <div className="geo3d-layer-copy">
              <strong>Construções 3D</strong>
              <small>Edificações do OpenStreetMap</small>
            </div>
            <button
              className={`geo3d-switch ${buildingsVisible ? "active" : ""}`}
              aria-label="Alternar construções 3D"
              aria-pressed={buildingsVisible}
              onClick={() => setBuildingsVisible((value) => !value)}
            ><span /></button>
          </div>

          <div className="geo3d-layer-card">
            <div className="geo3d-layer-icon"><Mountain size={17} /></div>
            <div className="geo3d-layer-copy">
              <strong>Relevo 3D</strong>
              <small>Modelo digital de elevação</small>
            </div>
            <button
              className={`geo3d-switch ${terrainVisible ? "active" : ""}`}
              aria-label="Alternar relevo 3D"
              aria-pressed={terrainVisible}
              onClick={() => setTerrainVisible((value) => !value)}
            ><span /></button>
          </div>

          <div className="geo3d-sidebar-divider" />
          <div className="geo3d-section-heading"><Navigation size={16} /><span>NAVEGAÇÃO</span></div>
          <button className="geo3d-action" onClick={resetCamera}><RotateCcw size={15} /> Centralizar em Boituva</button>
          <button className="geo3d-action" onClick={togglePitch}><Mountain size={15} /> Alternar visão 2D / 3D</button>
          <button className="geo3d-action" onClick={toggleFullscreen}><Maximize2 size={15} /> Tela cheia</button>

          <div className="geo3d-sidebar-note">
            <strong>Prévia técnica · MVP 0.1</strong>
            <p>As camadas municipais, equipamentos e indicadores serão conectados nas próximas etapas.</p>
          </div>
        </aside>

        <div className="geo3d-map-panel">
          <div ref={mapContainer} className="geo3d-map" />
          <div className="geo3d-map-title">
            <span className="geo3d-live-dot" />
            <div><strong>BOITUVA / SP</strong><small>Visão territorial tridimensional</small></div>
          </div>
          <div className="geo3d-map-coordinates">23°17′ S · 47°40′ W</div>
          {mapError && <div className="geo3d-map-alert">{mapError}</div>}
          <div className="geo3d-map-legend">
            <span><i className="legend-building" /> Edificações</span>
            <span><i className="legend-terrain" /> Relevo</span>
          </div>
        </div>
      </section>
      <footer className="geo3d-footer">
        <span>BOITUVA GEOINTELIGÊNCIA · MVP 0.1</span>
        <span>Dados cartográficos: © OpenStreetMap contributors · OpenFreeMap · Mapterhorn</span>
      </footer>
    </main>
  );
}
