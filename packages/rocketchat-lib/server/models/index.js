import {
	Avatars,
	ExportOperations,
	Messages,
	Reports,
	Rooms,
	Settings,
	Subscriptions,
	Uploads,
	UserDataFiles,
	Users,
	CustomSounds,
} from 'meteor/rocketchat:models';
import { Base as _Base } from 'meteor/rocketchat:models';

Object.assign(RocketChat.models, {
	_Base,
	Avatars,
	ExportOperations,
	Messages,
	Reports,
	Rooms,
	Settings,
	Subscriptions,
	Uploads,
	UserDataFiles,
	Users,
	CustomSounds,
});
