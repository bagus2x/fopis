// pages/garden/components/garden-map-drawer.tsx
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export interface MapHandle {
    flyTo: (center: [number, number], zoom?: number) => void;
    addMarker: (lngLat: [number, number]) => void;
    startDrawing: () => void;
    deletePolygon: () => void;
}

interface GardenMapDrawerProps {
    onMapReady?: () => void;
    onPolygonCreated?: (polygon: GeoJSON.Polygon, areaHa: number) => void;
    onPolygonDeleted?: () => void;
    initialPolygon?: GeoJSON.Polygon | null;
}

function computeAreaHa(coords: [number, number][]): number {
    if (coords.length < 3) return 0;
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    let a = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const [x1, y1] = coords[i];
        const [x2, y2] = coords[i + 1];
        a += toRad(x2 - x1) * (2 + Math.sin(toRad(y1)) + Math.sin(toRad(y2)));
    }
    return parseFloat((Math.abs((a * R * R) / 2) / 10000).toFixed(4));
}

const GardenMapDrawer = forwardRef<MapHandle, GardenMapDrawerProps>(
    (
        { onMapReady, onPolygonCreated, onPolygonDeleted, initialPolygon },
        ref,
    ) => {
        const mapContainer = useRef<HTMLDivElement>(null);
        const mapRef = useRef<maplibregl.Map | null>(null);
        const drawRef = useRef<MapboxDraw | null>(null);
        const markerRef = useRef<maplibregl.Marker | null>(null);
        const [isMapLoaded, setIsMapLoaded] = useState(false);

        useImperativeHandle(ref, () => ({
            flyTo: (center, zoom = 13) => {
                if (mapRef.current) {
                    mapRef.current.flyTo({ center, zoom, duration: 1200 });
                }
            },
            addMarker: (lngLat) => {
                if (!mapRef.current) return;

                if (markerRef.current) {
                    markerRef.current.setLngLat(lngLat);
                } else {
                    const el = document.createElement('div');
                    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#15803d" opacity="0.15"/><circle cx="12" cy="12" r="4" fill="white"/><circle cx="12" cy="12" r="2.5" fill="#15803d"/></svg>`;
                    el.style.cssText = 'width:28px;height:28px;';
                    markerRef.current = new maplibregl.Marker({ element: el })
                        .setLngLat(lngLat)
                        .addTo(mapRef.current);
                }
            },
            startDrawing: () => {
                if (drawRef.current && mapRef.current) {
                    drawRef.current.deleteAll();
                    drawRef.current.changeMode('draw_polygon');
                }
            },
            deletePolygon: () => {
                if (drawRef.current) {
                    drawRef.current.deleteAll();
                }
                if (markerRef.current) {
                    markerRef.current.remove();
                    markerRef.current = null;
                }
            },
        }));

        // Initialize map once
        useEffect(() => {
            if (!mapContainer.current || mapRef.current) return;

            const map = new maplibregl.Map({
                container: mapContainer.current,
                style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
                center: [107.6191, -6.9175],
                zoom: 13,
            });

            map.addControl(new maplibregl.NavigationControl(), 'top-right');
            map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

            const draw = new MapboxDraw({
                displayControlsDefault: false,
                styles: [
                    {
                        id: 'fill',
                        type: 'fill',
                        filter: ['all', ['==', '$type', 'Polygon']],
                        paint: {
                            'fill-color': '#16a34a',
                            'fill-opacity': 0.18,
                        },
                    },
                    {
                        id: 'stroke',
                        type: 'line',
                        filter: ['all', ['==', '$type', 'Polygon']],
                        paint: { 'line-color': '#15803d', 'line-width': 2 },
                    },
                    {
                        id: 'vertex',
                        type: 'circle',
                        filter: [
                            'all',
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'vertex'],
                        ],
                        paint: {
                            'circle-radius': 5,
                            'circle-color': '#fff',
                            'circle-stroke-color': '#15803d',
                            'circle-stroke-width': 2,
                        },
                    },
                    {
                        id: 'midpoint',
                        type: 'circle',
                        filter: [
                            'all',
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'midpoint'],
                        ],
                        paint: {
                            'circle-radius': 3,
                            'circle-color': '#15803d',
                        },
                    },
                ],
            });

            // @ts-expect-error maplibre compat
            map.addControl(draw);
            drawRef.current = draw;

            const handleDrawCreate = (e: { features: GeoJSON.Feature[] }) => {
                const f = e.features?.[0];
                if (!f || f.geometry.type !== 'Polygon') return;

                const poly = f.geometry as GeoJSON.Polygon;
                const coords = poly.coordinates[0] as [number, number][];

                // Use requestAnimationFrame to prevent blink
                requestAnimationFrame(() => {
                    onPolygonCreated?.(poly, computeAreaHa(coords));
                });
            };

            map.on('draw.create', handleDrawCreate);
            map.on('draw.update', handleDrawCreate);
            map.on('draw.delete', () => {
                requestAnimationFrame(() => {
                    onPolygonDeleted?.();
                });
            });

            map.on('load', () => {
                setIsMapLoaded(true);
                onMapReady?.();

                // Load initial polygon if provided
                if (initialPolygon) {
                    // Small delay to ensure draw is ready
                    setTimeout(() => {
                        if (drawRef.current) {
                            drawRef.current.add(initialPolygon);
                            const coords = initialPolygon.coordinates[0] as [
                                number,
                                number,
                            ][];
                            onPolygonCreated?.(
                                initialPolygon,
                                computeAreaHa(coords),
                            );
                        }
                    }, 100);
                }
            });

            mapRef.current = map;

            return () => {
                if (mapRef.current) {
                    mapRef.current.remove();
                    mapRef.current = null;
                }
                drawRef.current = null;
            };
        }, []); // Empty deps array - only run once

        // Handle initialPolygon changes separately
        useEffect(() => {
            if (!isMapLoaded || !drawRef.current || !initialPolygon) return;

            // Clear existing and add new polygon
            drawRef.current.deleteAll();
            drawRef.current.add(initialPolygon);
        }, [initialPolygon, isMapLoaded]);

        return <div ref={mapContainer} className="h-full w-full" />;
    },
);

GardenMapDrawer.displayName = 'GardenMapDrawer';

export default GardenMapDrawer;
