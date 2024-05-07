import { getUnreadRoomType } from '../../../../lib/rooms/roomTypes/unread';
import { roomCoordinator } from '../roomCoordinator';

const UnreadRoomType = getUnreadRoomType(roomCoordinator);

roomCoordinator.add(UnreadRoomType, {});
