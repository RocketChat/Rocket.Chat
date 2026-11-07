import type { IRoom } from '@rocket.chat/core-typings';
import { isPrivateRoom, isPublicRoom, isTeamRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';

import MarkdownText from '../../../components/MarkdownText';
import { _relativeToSiteRootUrl } from '../../../lib/absoluteUrl';
import { useCanEditRoom } from '../contextualBar/Info/hooks/useCanEditRoom';

export type RoomTopicProps = {
	room: IRoom;
};

// getRoomRoute delegates to RoomCoordinator.getRouteLink, which substitutes params without encoding them.
// Match Router.encodeParam's extra layer for characters that the route matcher decodes twice.
const encodeRoomName = (name: string): string => encodeURIComponent(name).replace(/%(2F|25|2B)/gi, '%25$1');

const RoomTopic = ({ room }: RoomTopicProps) => {
	const t = useTranslation();
	const canEdit = useCanEditRoom(room);
	const router = useRouter();

	const { topic } = room;
	const canEditTopic = canEdit && (isPublicRoom(room) || isPrivateRoom(room));

	if (!topic && !canEditTopic) {
		return null;
	}

	if (!topic && canEditTopic) {
		const encodedName = encodeRoomName(room.name ?? '');
		const { path } = router.getRoomRoute(room.t, { name: encodedName });
		const href = _relativeToSiteRootUrl(`${path}/${isTeamRoom(room) ? 'team-info' : 'channel-settings'}`);

		return (
			<Box is='a' href={href}>
				{t('Add_topic')}
			</Box>
		);
	}

	return <MarkdownText color='default' parseEmoji={true} variant='inlineWithoutBreaks' withTruncatedText content={topic} />;
};

export default RoomTopic;
