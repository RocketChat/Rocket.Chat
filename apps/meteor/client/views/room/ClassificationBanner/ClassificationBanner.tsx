import { Box, Text } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../contexts/RoomContext';
import { useRoomAbacInfo } from '../hooks/useRoomAbacInfo';

const ClassificationBanner = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const bannersEnabled = useSetting('ABAC_Classification_Banners_Enabled', false);
	const { data: banner } = useRoomAbacInfo(room._id, room.abacAttributes, {
		enabled: bannersEnabled,
		select: (data) => data.classificationBanner,
	});

	if (!bannersEnabled || !banner) {
		return null;
	}

	return (
		<Box
			role='region'
			aria-live='polite'
			aria-label={t('ABAC_Classification_Banner')}
			{...(banner.monospace && { fontFamily: 'mono' })}
			backgroundColor={banner.backgroundColor}
			color={banner.color}
			textTransform={banner.uppercase ? 'uppercase' : 'none'}
			fontScale='c2'
			height='x20'
			display='flex'
			alignItems='center'
			justifyContent='center'
		>
			<Text is='span' truncate>
				{banner.text}
			</Text>
		</Box>
	);
};

export default ClassificationBanner;
