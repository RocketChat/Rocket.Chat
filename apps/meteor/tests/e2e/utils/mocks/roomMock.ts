export interface IRoomMock {
	_id: string;
	fname: string;
	customFields: {};
	description: string;
	broadcast: boolean;
	encrypted: boolean;
	name: string;
	t: string;
	msgs: number;
	usersCount: number;
	u: {
		_id: string;
		username: string;
	};
	ts: Date;
	ro: boolean;
	default: boolean;
	sysMes: boolean;
	_updatedAt: Date;
}

export const roomMock: IRoomMock[] = [
	{
		_id: '9kc9F8BghhCp5bc3T',
		fname: 'private channel',
		customFields: {},
		description: 'any_description',
		broadcast: false,
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
		default: false,
		sysMes: true,
		_updatedAt: new Date(),
	},
	{
		_id: 'fWJChTFjhQLXZrusq',
		fname: 'public channel',
		customFields: {},
		description: 'any_description',
		broadcast: false,
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
		default: false,
		sysMes: true,
		_updatedAt: new Date(),
	},
];
