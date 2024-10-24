import { WebApp } from 'meteor/webapp';

import { roomAvatar } from './room';
import { userAvatarByUsername } from './user';

import './middlewares';

WebApp.connectHandlers.use('/avatar/room/', roomAvatar);
WebApp.connectHandlers.use('/avatar/', userAvatarByUsername);
