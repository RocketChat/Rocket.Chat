import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

type MapViewImageProps = {
	linkUrl: string;
	imageUrl: string;
};

const MapViewImage: FC<MapViewImageProps> = ({ linkUrl, imageUrl }) => {
	const t = useTranslation();

	return (
		<ExternalLink to={linkUrl}>
			<img src={imageUrl} alt={t('Shared_Location')} />
		</ExternalLink>
	);
};

export default MapViewImage;
