import { roomTypes } from '../../utils';
import LivechatRoomType from '../lib/LivechatRoomType';
import { settings } from '../../settings/client';
import { Rooms, Users } from '../../models/client';
import { AuthorizationUtils } from '../../authorization/client';

roomTypes.add(new LivechatRoomType(settings, Users, Rooms, AuthorizationUtils));
