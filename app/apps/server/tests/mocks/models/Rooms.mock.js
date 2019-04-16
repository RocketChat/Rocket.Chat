import { BaseModelMock } from './BaseModel.mock';

export class RoomsMock extends BaseModelMock {
	data = {
		GENERAL: {
			_id : 'GENERAL',
			ts : new Date('2019-03-27T20:51:36.808Z'),
			t : 'c',
			name : 'general',
			usernames : [],
			msgs : 31,
			usersCount : 3,
			default : true,
			_updatedAt : new Date('2019-04-10T17:44:34.931Z'),
			lastMessage : {
				_id : 1,
				t : 'uj',
				rid : 'GENERAL',
				ts : new Date('2019-03-30T01:22:08.389Z'),
				msg : 'rocket.cat',
				u : {
					_id : 'rocket.cat',
					username : 'rocket.cat',
				},
				groupable : false,
				_updatedAt : new Date('2019-03-30T01:22:08.412Z'),
			},
			lm : new Date('2019-04-10T17:44:34.873Z'),
		},
	}
}
