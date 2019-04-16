import { BaseModelMock } from './BaseModel.mock';

export class MessagesMock extends BaseModelMock {
	data = {
		1: {
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
	}
}
