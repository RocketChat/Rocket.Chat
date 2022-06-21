import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import ExternalLink from '../../components/ExternalLink';

type MapViewFallbackProps = {
	linkUrl: string;
};

const MapViewFallback: FC<MapViewFallbackProps> = ({ linkUrl }) => {
	const t = useTranslation();

	return (
		<Box is='span' fontScale='p2' display='inline-flex' alignItems='center' paddingBlock={4}>
			<Icon name='map-pin' size={20} color='hint' />
			<ExternalLink to={linkUrl}>{t('Shared_Location')}</ExternalLink>
		</Box>
	);
};

export default MapViewFallback;
