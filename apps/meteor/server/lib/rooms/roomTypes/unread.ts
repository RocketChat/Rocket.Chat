import { getUnreadRoomType } from '../../../../lib/rooms/roomTypes/unread';
import { roomCoordinator } from '../roomCoordinator';

export const UnreadRoomType = getUnreadRoomType(roomCoordinator);

roomCoordinator.add(UnreadRoomType, {});
