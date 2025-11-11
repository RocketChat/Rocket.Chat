// MapView.tsx
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState } from 'react';

import type { IMapProvider, MapProviderName } from './mapProvider';

export type MapViewProps = {
	latitude: number;
	longitude: number;
	zoom?: number;
	width?: number;
	height?: number;
	provider?: MapProviderName;
	mapInstance?: IMapProvider;
	showAttribution?: boolean;
};

const MapView: React.FC<MapViewProps> = ({
	latitude,
	longitude,
	zoom = 15,
	width = 512,
	height = 320,
	mapInstance,
	showAttribution = true,
}) => {
	const [errored, setErrored] = useState(false);
	const t = useTranslation();

	const src = useMemo(() => {
		if (!mapInstance) return '';
		return mapInstance.getStaticMapUrl(latitude, longitude, { zoom, width, height });
	}, [mapInstance, latitude, longitude, zoom, width, height]);

	if (!mapInstance || !src || errored) {
		// Fallback placeholder
		return (
			<div
				style={{
					width,
					height,
					borderRadius: 8,
					border: '1px solid #e0e0e0',
					display: 'grid',
					placeItems: 'center',
					background: '#fafafa',
					color: '#666',
					fontSize: 12,
				}}
				aria-label='Map preview unavailable'
				title='Map preview unavailable'
			>
				{t('Map_Preview_Unavailable')}
				<div style={{ fontSize: 11, marginTop: 4 }}>
					{latitude.toFixed(5)}, {longitude.toFixed(5)}
				</div>
			</div>
		);
	}

	return (
		<div style={{ position: 'relative', width, height }}>
			<img
				src={src}
				alt={t('Map_Preview_Alt')}
				width={width}
				height={height}
				style={{ width, height, borderRadius: 8, border: '1px solid #e0e0e0', display: 'block' }}
				onError={() => setErrored(true)}
				loading='lazy'
				referrerPolicy='no-referrer'
			/>
			{showAttribution && (
				<div
					style={{
						position: 'absolute',
						left: 8,
						bottom: 6,
						fontSize: 12,
						background: 'rgba(255,255,255,0.85)',
						padding: '2px 6px',
						borderRadius: 4,
					}}
				>
					{t('OSM_Attribution')}
				</div>
			)}
		</div>
	);
};

export default MapView;
