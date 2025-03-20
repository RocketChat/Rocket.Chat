import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isPrivateRoom, isPublicRoom, isTeamRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { RoomBanner, RoomBannerContent } from '@rocket.chat/ui-client';
import { useUserId, useTranslation, useRouter, useUserPresence } from '@rocket.chat/ui-contexts';

import MarkdownText from '../../../components/MarkdownText';
import { useCanEditRoom } from '../contextualBar/Info/hooks/useCanEditRoom';

type RoomTopicProps = {
	room: IRoom;
	user: IUser | null;
};

export const RoomTopic = ({ room }: RoomTopicProps) => {
	const t = useTranslation();
	const canEdit = useCanEditRoom(room);
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const directUserData = useUserPresence(directUserId);
	const router = useRouter();

	const currentRoute = router.getLocationPathname();
	const href = isTeamRoom(room) ? `${currentRoute}/team-info` : `${currentRoute}/channel-settings`;

	const topic = room.t === 'd' && (room.uids?.length ?? 0) < 3 ? directUserData?.statusText : room.topic;

	if (!topic && !canEdit) {
		return null;
	}

	return (
		<RoomBanner className='rcx-header-section rcx-topic-section' role='note'>
			<RoomBannerContent>
				{!topic && canEdit && (isPublicRoom(room) || isPrivateRoom(room)) ? (
					<Box is='a' href={href}>
						{t('Add_topic')}
					</Box>
				) : (
					<MarkdownText parseEmoji={true} variant='inlineWithoutBreaks' withTruncatedText content={topic} />
				)}
			</RoomBannerContent>
		</RoomBanner>
	);
};
