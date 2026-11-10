import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomNativeFederated, isRoomXMPPHostedMuc } from '@rocket.chat/core-typings';

/** Whether invites to `room` name remote members by raw username, since their user record is created only once they are added. */
export const invitesByRawUsername = (room: IRoom): boolean => isRoomNativeFederated(room) || isRoomXMPPHostedMuc(room);
