import { useSetting } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';

import MapViewFallback from './MapViewFallback';
import MapViewImage from './MapViewImage';
import { useAsyncImage } from './useAsyncImage';

type MapViewProps = {
	latitude: number;
	longitude: number;
};

const MapView: FC<MapViewProps> = ({ latitude, longitude }) => {
	const googleMapsApiKey = useSetting('MapView_GMapsAPIKey') as string;

	const linkUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}`;

	const imageUrl = useAsyncImage(
		googleMapsApiKey
			? `https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=250x250&markers=color:gray%7Clabel:%7C${latitude},${longitude}&key=${googleMapsApiKey}`
			: undefined,
	);

	if (!linkUrl) {
		return null;
	}

	if (!imageUrl) {
		return <MapViewFallback linkUrl={linkUrl} />;
	}

	return <MapViewImage linkUrl={linkUrl} imageUrl={imageUrl} />;
};

export default memo(MapView);
