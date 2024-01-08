import { getFavoriteRoomType } from '../../../../lib/rooms/roomTypes/favorite';
import { roomCoordinator } from '../roomCoordinator';

const FavoriteRoomType = getFavoriteRoomType(roomCoordinator);

roomCoordinator.add(FavoriteRoomType, {});
