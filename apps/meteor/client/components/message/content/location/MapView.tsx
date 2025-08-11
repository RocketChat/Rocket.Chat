import { useSetting } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import MapViewFallback from './MapViewFallback';
import MapViewImage from './MapViewImage';
import { useAsyncImage } from './hooks/useAsyncImage';

type MapViewProps = {
	latitude: number;
	longitude: number;
};

const MapView = ({ latitude, longitude }: MapViewProps) => {
	const locationIQKey = 'pk.898e468814facdcffda869b42260a2f0';

	const linkUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

	const imageUrl = useAsyncImage(
		`https://maps.locationiq.com/v2/staticmap?key=${locationIQKey}&center=${latitude},${longitude}&zoom=16&size=250x250&markers=icon:small-red-cutout|${latitude},${longitude}`,
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
