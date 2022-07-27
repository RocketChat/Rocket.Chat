import type { IRoom } from '@rocket.chat/core-typings';

export const roomPrivate1: IRoom = {
	_id: 'room_private1',
	name: 'room_private1',
	fname: 'room_private1',
	description: 'any_description',
	encrypted: false,
	t: 'p',
	msgs: 0,
	usersCount: 1,
	u: {
		_id: 'user1',
		username: 'user1',
	},
	ts: new Date(),
	ro: false,
	_updatedAt: new Date(),
	autoTranslateLanguage: '',
};

export const roomPublic1: IRoom = {
	_id: 'room_public1',
	name: 'room_public1',
	fname: 'room_public1',
	description: 'any_description',
	encrypted: false,
	t: 'c',
	msgs: 0,
	usersCount: 1,
	u: {
		_id: 'user1',
		username: 'user1',
	},
	ts: new Date(),
	ro: false,
	_updatedAt: new Date(),
	autoTranslateLanguage: '',
};
