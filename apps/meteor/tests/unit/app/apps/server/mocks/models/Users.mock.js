import { BaseModelMock } from './BaseModel.mock';

export class UsersMock extends BaseModelMock {
	data = {
		'rocket.cat': {
			_id: 'rocket.cat',
			createdAt: new Date('2019-03-27T20:51:36.821Z'),
			avatarOrigin: 'local',
			name: 'Rocket.Cat',
			username: 'rocket.cat',
			status: 'online',
			statusDefault: 'online',
			utcOffset: 0,
			active: true,
			type: 'bot',
			_updatedAt: new Date('2019-03-30T01:11:50.496Z'),
			roles: ['bot'],
		},
	};

	static convertedData = {
		'rocket.cat': {
			id: 'rocket.cat',
			username: 'rocket.cat',
			emails: [
				{
					address: 'rocketcat@rocket.chat',
					verified: true,
				},
			],
			type: 'bot',
			isEnabled: true,
			name: 'Rocket.Cat',
			roles: ['bot'],
			status: 'online',
			statusConnection: 'online',
			utcOffset: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLoginAt: undefined,
		},
	};
}
