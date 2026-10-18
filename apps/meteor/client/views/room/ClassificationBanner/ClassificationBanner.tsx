import { isABACManagedRoom, isDiscussion, isRoomFederated } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { roomsQueryKeys } from '../../../lib/queryKeys';
import { useIsABACAvailable } from '../../admin/ABAC/hooks/useIsABACAvailable';
import { useRoom } from '../contexts/RoomContext';
import { useRoomAbacInfo } from '../hooks/useRoomAbacInfo';

const ClassificationBanner = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const isABACAvailable = useIsABACAvailable();
	const bannersEnabled = useSetting('ABAC_Classification_Banners_Enabled', false);
	const { data: banner } = useRoomAbacInfo(room._id, room.abacAttributes, {
		enabled: bannersEnabled && isABACAvailable,
		select: (data) => data.classificationBanner,
		...(!isABACManagedRoom(room) && {
			queryKey: roomsQueryKeys.classificationBanner({
				t: room.t,
				federated: isRoomFederated(room),
				discussion: isDiscussion(room),
				team: !!room.teamId,
			}),
			staleTime: 5 * 60_000,
		}),
	});

	if (!bannersEnabled || !isABACAvailable || !banner) {
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
			<Box is='span' withTruncatedText>
				{banner.text}
			</Box>
		</Box>
	);
};

export default ClassificationBanner;
