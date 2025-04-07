import { useUserId } from '@rocket.chat/ui-contexts';

import { Users } from '../../../../../app/models/client';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

export const useMessageComposerIsReadOnly = (rid: string): boolean => {
	const uid = useUserId();

	const isReadOnly = Users.use((state) => Boolean(roomCoordinator.readOnly(rid, (uid ? state.get(uid) : undefined)!)));

	return isReadOnly;
};
