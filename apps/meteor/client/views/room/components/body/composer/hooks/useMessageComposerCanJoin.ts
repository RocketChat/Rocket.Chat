import type { IRoom } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { useReactiveValue } from '../../../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';

export const useMessageComposerCanJoin = (rid: IRoom['_id']): boolean =>
	Boolean(useReactiveValue(useCallback(() => Meteor.userId() && roomCoordinator.getRoomDirectivesById(rid)?.showJoinLink(rid), [rid])));
