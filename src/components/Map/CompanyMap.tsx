import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Company, MapTileProvider } from '../../types/company';
import { formatCurrency, formatPhone, getWhatsAppUrl } from '../../utils/cnpjUtils';
import { MapPin, Phone, MessageSquare, Plus, Check, ExternalLink, Navigation } from 'lucide-react';

interface CompanyMapProps {
  companies: Company[];
  center: { lat: number; lng: number; enderecoTexto?: string };
  radiusKm: number;
  selectedCompany: Company | null;
  tileProviderId: 'osm' | 'carto' | 'satellite' | 'google';
  googleMapsApiKey?: string;
  onSelectCompany: (company: Company) => void;
  onCenterChange: (newCenter: { lat: number; lng: number }) => void;
  onToggleDatabase: (company: Company) => void;
}

const TILE_PROVIDERS: Record<string, { url: string; attribution: string; subdomains?: string[] }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> colaboradores',
    subdomains: ['a', 'b', 'c'],
  },
  carto: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  google: {
    // Google Maps standard tile layer url
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
  },
};

export const CompanyMap: React.FC<CompanyMapProps> = ({
  companies,
  center,
  radiusKm,
  selectedCompany,
  tileProviderId,
  onSelectCompany,
  onCenterChange,
  onToggleDatabase,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    const provider = TILE_PROVIDERS[tileProviderId] || TILE_PROVIDERS.carto;
    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || ['abc'],
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer group for company markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Allow user to click anywhere on map to reposition the search center
    map.on('click', (e: L.LeafletMouseEvent) => {
      onCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile provider when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const provider = TILE_PROVIDERS[tileProviderId] || TILE_PROVIDERS.carto;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || ['abc'],
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [tileProviderId]);

  // Update Center Marker & Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const radiusMeters = radiusKm * 1000;

    // Create or update center marker (Draggable pin with radar wave animation)
    const centerIcon = L.divIcon({
      className: 'custom-center-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
          <div class="w-7 h-7 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs">
            📍
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng([center.lat, center.lng]);
    } else {
      const marker = L.marker([center.lat, center.lng], {
        icon: centerIcon,
        draggable: true,
      }).addTo(map);

      marker.bindTooltip('<b>Centro de Busca (Arraste ou clique no mapa)</b>', {
        permanent: false,
        direction: 'top',
      });

      marker.on('dragend', (e) => {
        const newPos = (e.target as L.Marker).getLatLng();
        onCenterChange({ lat: newPos.lat, lng: newPos.lng });
      });

      centerMarkerRef.current = marker;
    }

    // Update or create Radius Circle
    if (circleLayerRef.current) {
      circleLayerRef.current.setLatLng([center.lat, center.lng]);
      circleLayerRef.current.setRadius(radiusMeters);
    } else {
      const circle = L.circle([center.lat, center.lng], {
        radius: radiusMeters,
        color: '#2563eb', // blue-600
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#3b82f6', // blue-500
        fillOpacity: 0.12,
      }).addTo(map);

      circleLayerRef.current = circle;
    }

    // Pan map smoothly to new center if needed
    const currentCenter = map.getCenter();
    const dist = Math.abs(currentCenter.lat - center.lat) + Math.abs(currentCenter.lng - center.lng);
    if (dist > 0.05) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center.lat, center.lng, radiusKm]);

  // Update Company Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    companies.forEach((company) => {
      const isSelected = selectedCompany?.id === company.id;
      const isInDb = company.isInDatabase;
      const isAtiva = company.situacaoCadastral === 'ATIVA';

      // Determine pin color:
      // Green = Ativa, Orange = Proposta/Lead, Blue = Já no Banco, Red/Gray = Baixada
      let pinColor = '#10b981'; // emerald-500
      let pinSymbol = '🏢';
      let badgeText = 'Ativa';

      if (!isAtiva) {
        pinColor = '#94a3b8'; // slate-400
        pinSymbol = '⚠️';
        badgeText = company.situacaoCadastral;
      } else if (isInDb) {
        pinColor = '#6366f1'; // indigo-500
        pinSymbol = '★';
        badgeText = 'No Banco';
      } else if (company.cnaePrincipal.codigo.startsWith('68')) {
        pinColor = '#0284c7'; // sky-600 (Imobiliário)
        pinSymbol = '🏠';
      } else if (company.cnaePrincipal.codigo.startsWith('41')) {
        pinColor = '#d97706'; // amber-600 (Construção)
        pinSymbol = '🏗️';
      } else if (company.cnaePrincipal.codigo.startsWith('62')) {
        pinColor = '#8b5cf6'; // violet-500 (TI)
        pinSymbol = '💻';
      }

      const iconHtml = `
        <div class="relative cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          <div style="background-color: ${pinColor};" class="w-9 h-9 rounded-2xl shadow-lg border-2 border-white flex items-center justify-center text-white text-base">
            ${pinSymbol}
          </div>
          ${
            isInDb
              ? '<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border border-white rounded-full flex items-center justify-center text-[8px] font-bold text-slate-900">✓</span>'
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'company-marker-icon',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([company.coordenadas.lat, company.coordenadas.lng], {
        icon: customIcon,
      });

      // Interactive popup
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 text-slate-800 max-w-[280px] font-sans';

      const whatsappUrl = getWhatsAppUrl(company.contato.telefone || company.contato.telefone2);

      popupDiv.innerHTML = `
        <div class="border-b pb-2 mb-2">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              isAtiva ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }">${badgeText}</span>
            <span class="text-[11px] text-blue-600 font-semibold">${company.distanciaKm !== undefined ? `${company.distanciaKm} km de você` : ''}</span>
          </div>
          <h4 class="font-bold text-sm leading-tight text-slate-900">${company.nomeFantasia || company.razaoSocial}</h4>
          <p class="text-[11px] text-slate-500 font-mono mt-0.5">CNPJ: ${company.cnpj}</p>
        </div>

        <div class="space-y-1 text-xs mb-3">
          <p class="line-clamp-2 text-slate-600">
            <strong class="text-slate-700">CNAE:</strong> ${company.cnaePrincipal.codigo} - ${company.cnaePrincipal.descricao}
          </p>
          <p class="text-slate-600">
            <strong class="text-slate-700">Endereço:</strong> ${company.endereco.logradouro}, ${company.endereco.numero} - ${company.endereco.bairro}, ${company.endereco.municipio}/${company.endereco.uf}
          </p>
          ${company.capitalSocial ? `<p class="text-slate-600"><strong class="text-slate-700">Capital:</strong> ${formatCurrency(company.capitalSocial)}</p>` : ''}
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="flex gap-1.5">
            <button id="btn-toggle-db-${company.id}" class="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
              isInDb
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }">
              ${isInDb ? '✓ No Banco' : '+ Salvar no Banco'}
            </button>
            <button id="btn-details-${company.id}" class="py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
              Detalhes
            </button>
          </div>

          <div class="flex gap-1">
            ${
              company.contato.telefone
                ? `<a href="tel:${company.contato.telefone}" class="flex-1 py-1 px-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-center text-slate-700 hover:bg-slate-100">
                    📞 Ligar
                  </a>`
                : ''
            }
            ${
              whatsappUrl
                ? `<a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 py-1 px-1.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-center text-emerald-700 font-semibold hover:bg-emerald-100">
                    💬 WhatsApp
                  </a>`
                : ''
            }
            <a href="https://www.google.com/maps/search/?api=1&query=${company.coordenadas.lat},${company.coordenadas.lng}" target="_blank" rel="noopener noreferrer" class="py-1 px-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100" title="Ver no Google Maps">
              🗺️ Rota
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupDiv, { maxWidth: 300 });

      marker.on('popupopen', () => {
        const btnToggle = document.getElementById(`btn-toggle-db-${company.id}`);
        const btnDetails = document.getElementById(`btn-details-${company.id}`);

        if (btnToggle) {
          btnToggle.onclick = () => {
            onToggleDatabase(company);
          };
        }
        if (btnDetails) {
          btnDetails.onclick = () => {
            onSelectCompany(company);
          };
        }
      });

      marker.on('click', () => {
        onSelectCompany(company);
      });

      markersLayer.addLayer(marker);
    });
  }, [companies, selectedCompany?.id, onSelectCompany, onToggleDatabase]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[420px]" />

      {/* Floating Center Radius Badge */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md shadow-md rounded-xl p-2.5 border border-slate-200/80 text-xs flex items-center gap-2 max-w-xs pointer-events-auto">
        <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
        <div>
          <span className="font-semibold text-slate-800">Raio ativo: {radiusKm} km</span>
          <p className="text-[11px] text-slate-500">
            {companies.length} {companies.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
          </p>
        </div>
      </div>
    </div>
  );
};
