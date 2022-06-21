import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import ExternalLink from '../../components/ExternalLink';

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
