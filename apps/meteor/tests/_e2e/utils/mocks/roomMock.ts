import type { IRoom } from '@rocket.chat/core-typings';

export const roomMock: IRoom[] = [
	{
		_id: '9kc9F8BghhCp5bc3T',
		fname: 'private channel',
		description: 'any_description',
		encrypted: false,
		name: 'private channel',
		t: 'p',
		msgs: 0,
		usersCount: 1,
		u: {
			_id: 'vvsKGW5tKKqP9vj54',
			username: 'user.name.test',
		},
		ts: new Date(),
		ro: false,
		_updatedAt: new Date(),
		autoTranslateLanguage: '',
	},
	{
		_id: 'fWJChTFjhQLXZrusq',
		fname: 'public channel',
		description: 'any_description',
		encrypted: false,
		name: 'public channel',
		t: 'c',
		msgs: 0,
		usersCount: 1,
		u: {
			_id: 'vvsKGW5tKKqP9vj54',
			username: 'user.name.test',
		},
		ts: new Date(),
		ro: false,
		_updatedAt: new Date(),
		autoTranslateLanguage: '',
	},
];
