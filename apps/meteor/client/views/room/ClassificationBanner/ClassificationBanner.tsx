import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { roomsQueryKeys } from '../../../lib/queryKeys';
import { useIsABACManagedRoom } from '../../admin/ABAC/hooks/useIsABACManagedRoom';
import { useRoom } from '../contexts/RoomContext';

const ClassificationBanner = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const isABACRoom = useIsABACManagedRoom(room);
	const bannersEnabled = useSetting('ABAC_Classification_Banners_Enabled', false);
	const enabled = bannersEnabled && isABACRoom;
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

	const { data: banner } = useQuery({
		queryKey: [...roomsQueryKeys.info(room._id), 'classificationBanner', room.abacAttributes],
		queryFn: async () => (await getRoomInfo({ roomId: room._id })).classificationBanner ?? null,
		enabled,
	});

	if (!enabled || !banner) {
		return null;
	}

	return (
		<Box
			role='region'
			aria-live='polite'
			aria-label={t('ABAC_Room_Attributes')}
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
			<Box is='span' withTruncatedText>
				{banner.text}
			</Box>
		</Box>
	);
};

export default ClassificationBanner;
