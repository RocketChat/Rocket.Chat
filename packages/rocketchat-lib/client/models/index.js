import { Avatars } from 'meteor/rocketchat:models';
import { Base as _Base } from 'meteor/rocketchat:models';
import { Uploads } from 'meteor/rocketchat:models';
import { UserDataFiles } from 'meteor/rocketchat:models';

Object.assign(RocketChat.models, {
	_Base,
	Avatars,
	Uploads,
	UserDataFiles,
});
