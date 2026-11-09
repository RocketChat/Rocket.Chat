import { BaseModelMock } from './BaseModel.mock';

export class MessagesMock extends BaseModelMock {
	data = {
		SimpleMessageMock: {
			_id: 'SimpleMessageMock',
			t: 'uj',
			rid: 'GENERAL',
			ts: new Date('2019-03-30T01:22:08.389Z'),
			msg: 'rocket.cat',
			u: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
			groupable: false,
			_updatedAt: new Date('2019-03-30T01:22:08.412Z'),
		},

		LivechatGuestMessageMock: {
			_id: 'LivechatGuestMessageMock',
			rid: 'LivechatRoom',
			msg: 'Help wanted',
			token: 'guest-token',
			alias: 'Livechat Guest',
			ts: new Date('2019-04-06T03:57:28.263Z'),
			u: {
				_id: 'guest1234',
				username: 'guest1234',
				name: 'Livechat Guest',
			},
			_updatedAt: new Date('2019-04-06T03:57:28.278Z'),
			mentions: [],
			channels: [],
		},
	};
}
