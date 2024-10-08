import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

type MapViewImageProps = {
	linkUrl: string;
	imageUrl: string;
};

const MapViewImage = ({ linkUrl, imageUrl }: MapViewImageProps) => {
	const t = useTranslation();

	return (
		<ExternalLink to={linkUrl}>
			<img src={imageUrl} alt={t('Shared_Location')} />
		</ExternalLink>
	);
};

export default MapViewImage;
