import { roomTypes } from '../../utils/client';
import { DiscussionRoomType } from '../lib/discussionRoomType';
import { settings } from '../../settings/client';
import { Rooms, Users } from '../../models/client';
import { AuthorizationUtils } from '../../authorization/client';
import { userCommonUtils } from '../../utils/client';

roomTypes.add(new DiscussionRoomType(settings, Users, Rooms, AuthorizationUtils, userCommonUtils));