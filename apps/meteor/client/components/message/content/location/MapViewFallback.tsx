import { Box, StatusIcon } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export type MapViewFallbackProps = {
	linkUrl: string;
};

const MapViewFallback = ({ linkUrl }: MapViewFallbackProps) => {
	const { t } = useTranslation();

	return (
		<Box is='span' fontScale='p2' display='inline-flex' alignItems='center' paddingBlock={4}>
			<StatusIcon name='map-pin' size='x20' status='hint' />
			<ExternalLink to={linkUrl}>{t('Shared_Location')}</ExternalLink>
		</Box>
	);
};

export default MapViewFallback;
