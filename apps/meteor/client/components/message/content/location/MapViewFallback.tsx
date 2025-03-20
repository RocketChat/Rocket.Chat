import { Box, Icon } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type MapViewFallbackProps = {
	linkUrl: string;
};

const MapViewFallback = ({ linkUrl }: MapViewFallbackProps) => {
	const { t } = useTranslation();

	return (
		<Box is='span' fontScale='p2' display='inline-flex' alignItems='center' paddingBlock={4}>
			<Icon name='map-pin' size='x20' color='hint' />
			<ExternalLink to={linkUrl}>{t('Shared_Location')}</ExternalLink>
		</Box>
	);
};

export default MapViewFallback;
