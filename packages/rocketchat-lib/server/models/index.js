import { Avatars } from 'meteor/rocketchat:models';
import { Base as _Base } from 'meteor/rocketchat:models';
import { ExportOperations } from 'meteor/rocketchat:models';
import { Messages } from 'meteor/rocketchat:models';
import { Reports } from 'meteor/rocketchat:models';
import { Rooms } from 'meteor/rocketchat:models';
import { Settings } from 'meteor/rocketchat:models';
import { Subscriptions } from 'meteor/rocketchat:models';
import { Uploads } from 'meteor/rocketchat:models';
import { UserDataFiles } from 'meteor/rocketchat:models';
import { Users } from 'meteor/rocketchat:models';

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
});
