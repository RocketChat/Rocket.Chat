import { BaseModelMock } from './BaseModel.mock';

export class RoomsMock extends BaseModelMock {
	data = {
		GENERAL: {
			_id: 'GENERAL',
			ts: new Date('2019-03-27T20:51:36.808Z'),
			t: 'c',
			name: 'general',
			usernames: [],
			msgs: 31,
			usersCount: 3,
			default: true,
			_updatedAt: new Date('2019-04-10T17:44:34.931Z'),
			lastMessage: {
				_id: 1,
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
			lm: new Date('2019-04-10T17:44:34.873Z'),
		},

		LivechatRoom: {
			_id: 'LivechatRoom',
			msgs: 41,
			usersCount: 1,
			lm: new Date('2019-04-07T23:45:25.407Z'),
			fname: 'Livechat Guest',
			t: 'l',
			ts: new Date('2019-04-06T03:56:17.040Z'),
			v: {
				_id: 'yDLaWs5Rzf5mzQsmB',
				username: 'guest-4',
				token: 'tkps932ccsl6me7intd3',
				status: 'away',
			},
			servedBy: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
				ts: new Date('2019-04-06T03:56:17.040Z'),
			},
			cl: false,
			open: true,
			_updatedAt: new Date('2019-04-07T23:45:25.469Z'),
			lastMessage: {
				_id: 'zgEMhaMLCyDPu7xMn',
				rid: 'JceP6CZrpcA4j3NNe',
				msg: 'a',
				ts: new Date('2019-04-07T23:45:25.407Z'),
				u: {
					_id: '3Wz2wANqwrd7Hu5Fo',
					username: 'dgubert',
					name: 'Douglas Gubert',
				},
				_updatedAt: new Date('2019-04-07T23:45:25.433Z'),
				mentions: [],
				channels: [],
			},
			metrics: {
				v: {
					lq: new Date('2019-04-06T03:57:28.263Z'),
				},
				reaction: {
					fd: new Date('2019-04-06T03:57:17.083Z'),
					ft: 60.043,
					tt: 52144.278,
				},
				response: {
					avg: 26072.0655,
					fd: new Date('2019-04-06T03:57:17.083Z'),
					ft: 59.896,
					total: 2,
					tt: 52144.131,
				},
				servedBy: {
					lr: new Date('2019-04-06T18:25:32.394Z'),
				},
			},
			responseBy: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
		},
	};

	static convertedData = {
		GENERAL: {
			id: 'GENERAL',
			slugifiedName: 'general',
			displayName: undefined,
			creator: undefined,
			createdAt: new Date('2019-03-27T20:51:36.808Z'),
			type: 'c',
			messageCount: 31,
			displaySystemMessages: true,
			isReadOnly: false,
			isDefault: true,
			updatedAt: new Date('2019-04-10T17:44:34.931Z'),
			lastModifiedAt: new Date('2019-04-10T17:44:34.873Z'),
			customFields: {},
		},

		LivechatRoom: {
			id: 'LivechatRoom',
			slugifiedName: undefined,
			displayName: 'Livechat Guest',
			creator: undefined,
			createdAt: new Date('2019-04-06T03:56:17.040Z'),
			type: 'l', // Apps-Engine defines the wrong type for livechat rooms
			messageCount: 41,
			displaySystemMessages: true,
			isReadOnly: false,
			isDefault: false,
			updatedAt: new Date('2019-04-07T23:45:25.469Z'),
			lastModifiedAt: new Date('2019-04-07T23:45:25.407Z'),
			customFields: {},
		},
	};
}
