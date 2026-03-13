import type { IRoom } from '@rocket.chat/core-typings';
import { useRoomRoute } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ParentRoomButton from '../ParentRoomButton';

type ParentDiscussionProps = {
	loading?: boolean;
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const ParentDiscussion = ({ loading = false, room }: ParentDiscussionProps) => {
	const { t } = useTranslation();
	const goToRoom = useRoomRoute();
	const roomName = room.fname || room.name || '';

	const handleRedirect = (): void => {
		goToRoom({ rid: room._id, t: room.t, name: room.name });
	};

	return <ParentRoomButton loading={loading} onClick={handleRedirect} title={t('Back_to__roomName__channel', { roomName })} />;
};

export default ParentDiscussion;
