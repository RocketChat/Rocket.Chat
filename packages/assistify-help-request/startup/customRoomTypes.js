/* globals RocketChat */

import {RequestRoomType, ExpertiseRoomType} from '../lib/roomTypes';

RocketChat.roomTypes.add(new RequestRoomType());
RocketChat.roomTypes.add(new ExpertiseRoomType());

