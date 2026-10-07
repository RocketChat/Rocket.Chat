import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';

/**
 * Whether a room can hold a video call as far as federation goes: any room outside it, and a native federated room
 * where federated calls are enabled.
 */
export const federationAllowsVideoCall = (room: Partial<IRoom>, federatedCallsEnabled: boolean): boolean =>
	!isRoomFederated(room) || (federatedCallsEnabled && isRoomNativeFederated(room));
