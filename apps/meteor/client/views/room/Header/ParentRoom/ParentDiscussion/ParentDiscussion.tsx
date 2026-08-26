import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useRoomRoute, useUserDisplayName } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ParentRoomButton from '../ParentRoomButton';

export type ParentDiscussionProps = {
	loading?: boolean;
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u' | 'federated'>;
};

const getChannelRoomName = (room: ParentDiscussionProps['room'], allowSpecialChars: boolean): string => {
	if (room.prid || isRoomFederated(room)) {
		return room.fname || '';
	}

	return (allowSpecialChars ? room.fname || room.name : room.name) || '';
};

const ParentDiscussion = ({ loading = false, room }: ParentDiscussionProps) => {
	const { t } = useTranslation();
	const goToRoom = useRoomRoute();
	const allowSpecialChars = useSetting('UI_Allow_room_names_with_special_chars', false);
	const userDisplayName = useUserDisplayName({ name: room.fname, username: room.name });
	const roomName = room.t === 'c' || room.t === 'p' ? getChannelRoomName(room, allowSpecialChars) : (userDisplayName ?? '');

	const handleRedirect = (): void => {
		goToRoom({ rid: room._id, t: room.t, name: room.name });
	};

	return <ParentRoomButton loading={loading} onClick={handleRedirect} title={t('Back_to__roomName__channel', { roomName })} />;
};

export default ParentDiscussion;
