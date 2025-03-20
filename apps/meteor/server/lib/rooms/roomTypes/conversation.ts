import { getConversationRoomType } from '../../../../lib/rooms/roomTypes/conversation';
import { roomCoordinator } from '../roomCoordinator';

const ConversationRoomType = getConversationRoomType(roomCoordinator);

roomCoordinator.add(ConversationRoomType, {});
