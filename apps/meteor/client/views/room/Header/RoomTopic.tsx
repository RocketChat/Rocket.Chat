import type { IRoom } from '@rocket.chat/core-typings';
import { isPrivateRoom, isPublicRoom, isTeamRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';

import MarkdownText from '../../../components/MarkdownText';
import { useCanEditRoom } from '../contextualBar/Info/hooks/useCanEditRoom';

type RoomTopicProps = {
	room: IRoom;
};

const RoomTopic = ({ room }: RoomTopicProps) => {
	const t = useTranslation();
	const canEdit = useCanEditRoom(room);
	const router = useRouter();

	const currentRoute = router.getLocationPathname();
	const href = isTeamRoom(room) ? `${currentRoute}/team-info` : `${currentRoute}/channel-settings`;

	const { topic } = room;
	const canEditTopic = canEdit && (isPublicRoom(room) || isPrivateRoom(room));

	if (!topic && !canEditTopic) {
		return null;
	}

	if (!topic && canEditTopic) {
		return (
			<Box is='a' href={href}>
				{t('Add_topic')}
			</Box>
		);
	}

	return <MarkdownText color='default' parseEmoji={true} variant='inlineWithoutBreaks' withTruncatedText content={topic} />;
};

export default RoomTopic;
