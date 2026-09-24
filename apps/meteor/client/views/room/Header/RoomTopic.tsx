import type { IRoom } from '@rocket.chat/core-typings';
import { isPrivateRoom, isPublicRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';

import { useRoomHeaderActions } from './RoomHeaderActionsContext';
import MarkdownText from '../../../components/MarkdownText';
import { useCanEditRoom } from '../contextualBar/Info/hooks/useCanEditRoom';

export type RoomTopicProps = {
	room: IRoom;
};

const RoomTopic = ({ room }: RoomTopicProps) => {
	const t = useTranslation();
	const canEdit = useCanEditRoom(room);
	const { roomSettingsHref } = useRoomHeaderActions();

	const { topic } = room;
	const canEditTopic = canEdit && (isPublicRoom(room) || isPrivateRoom(room));

	if (!topic && !canEditTopic) {
		return null;
	}

	if (!topic && canEditTopic) {
		return (
			<Box is='a' href={roomSettingsHref(room)}>
				{t('Add_topic')}
			</Box>
		);
	}

	return <MarkdownText color='default' parseEmoji={true} variant='inlineWithoutBreaks' withTruncatedText content={topic} />;
};

export default RoomTopic;
