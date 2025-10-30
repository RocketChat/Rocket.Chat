// MapLibreMap.tsx
import type { FeatureCollection, LineString } from 'geojson';
import type { Map as MLMap } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';

type Props = {
	lat: number;
	lon: number;
	zoom?: number;
	height?: number | string;
	liveCoords?: { lon: number; lat: number } | null;
	visible?: boolean;
};

export default function MapLibreMap({ lat, lon, zoom = 15, height = 360, liveCoords, visible = true }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<MLMap | null>(null);
	const markerRef = useRef<maplibregl.Marker | null>(null);
	const trailRef = useRef<maplibregl.GeoJSONSource | null>(null);
	const trailCoordsRef = useRef<[number, number][]>([]);
	const resizeObsRef = useRef<ResizeObserver | null>(null);

	// init map
	useEffect(() => {
		if (!containerRef.current || mapRef.current) return;

		const style: maplibregl.StyleSpecification = {
			version: 8,
			sources: {
				osm: {
					type: 'raster',
					tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
					tileSize: 256,
					attribution: '© OpenStreetMap contributors',
				},
			},
			layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
		};

		const map = new maplibregl.Map({
			container: containerRef.current,
			style,
			center: [lon, lat],
			zoom,
		});
		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		mapRef.current = map;

		markerRef.current = new maplibregl.Marker({ color: '#1976d2' }).setLngLat([lon, lat]).addTo(map);

		map.on('load', () => {
			map.addSource('trail', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] },
			});
			map.addLayer({
				id: 'trail-line',
				type: 'line',
				source: 'trail',
				paint: { 'line-width': 4, 'line-color': '#1976d2' },
			});
			trailRef.current = map.getSource('trail') as maplibregl.GeoJSONSource;
		});

		requestAnimationFrame(() => map.resize());

		const onWinResize = () => map.resize();
		window.addEventListener('resize', onWinResize);

		if ('ResizeObserver' in window) {
			resizeObsRef.current = new ResizeObserver(() => map.resize());
			resizeObsRef.current.observe(containerRef.current);
		}

		return () => {
			resizeObsRef.current?.disconnect();
			window.removeEventListener('resize', onWinResize);
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
			trailRef.current = null;
			trailCoordsRef.current = [];
		};
	    map.on('error', (e) => {
			console.error('MapLibre error:', e);
		});
	}, []);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		map.setCenter([lon, lat]);
		markerRef.current?.setLngLat([lon, lat]);
	}, [lat, lon]);

	useEffect(() => {
        const map = mapRef.current;
        if (!map || !visible) return;

        let r1 = 0;
        let r2 = 0;

        // wait for visibility/layout to settle, then resize
        r1 = requestAnimationFrame(() => {
            r2 = requestAnimationFrame(() => {
            map.resize();
            });
        });

        return () => {
            if (r1) cancelAnimationFrame(r1);
            if (r2) cancelAnimationFrame(r2);
        };
    }, [visible]);

	useEffect(() => {
		if (!liveCoords || !mapRef.current || !markerRef.current) return;
		const { lon: LON, lat: LAT } = liveCoords;

		markerRef.current.setLngLat([LON, LAT]);
		const maxTrailLength = 1000;
		trailCoordsRef.current.push([LON, LAT]);
		if (trailCoordsRef.current.length > maxTrailLength) {
			trailCoordsRef.current.shift();
		}

		if (trailRef.current) {
			const data: FeatureCollection<LineString> = {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						properties: {},
						geometry: { type: 'LineString', coordinates: trailCoordsRef.current },
					},
				],
			};
			trailRef.current.setData(data);
		}
	}, [liveCoords]);

	return (
		<div style={{ position: 'relative' }}>
			<div
				ref={containerRef}
				style={{
					width: '100%',
					height,
					minHeight: typeof height === 'number' ? `${height}px` : height || 360,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 8,
					bottom: 6,
					fontSize: 12,
					background: 'rgba(255,255,255,0.8)',
					padding: '2px 6px',
					borderRadius: 4,
				}}
			>
				© OpenStreetMap contributors
			</div>
		</div>
	);
}
