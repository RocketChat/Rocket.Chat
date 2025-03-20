import type { MessageTypesValues } from '@rocket.chat/core-typings';

export const validFile = { name: 'screenshot.png', buffer: Buffer.from([1, 2, 3]) };

export const invalidFile = { name: 'audio.mp3', buffer: null };

export const messages = [
	{
		msg: 'Hello, how can I help you today?',
		ts: '2022-11-21T16:00:00.000Z',
		u: {
			_id: '123',
			name: 'Juanito De Ponce',
			username: 'juanito.ponce',
		},
	},
	{
		msg: 'I am having trouble with my account.',
		ts: '2022-11-21T16:00:00.000Z',
		u: {
			_id: '321',
			name: 'Christian Castro',
			username: 'cristiano.castro',
		},
		md: [
			{
				type: 'UNORDERED_LIST',
				value: [
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'I am having trouble with my account;' }] },
					{
						type: 'LIST_ITEM',
						value: [
							{ type: 'PLAIN_TEXT', value: 'I am having trouble with my password. ' },
							{ type: 'EMOJI', value: undefined, unicode: '🙂' },
						],
					},
				],
			},
		],
	},
	{
		msg: 'Can you please provide your account email?',
		ts: '2022-11-21T16:00:00.000Z',
		u: {
			_id: '123',
			name: 'Juanito De Ponce',
			username: 'juanito.ponce',
		},
	},
];

export const validSystemMessage = {
	ts: '2022-11-21T16:00:00.000Z',
	u: {
		_id: '123',
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
	t: 'livechat-started' as MessageTypesValues,
};

export const invalidSystemMessage = {
	ts: '2022-11-21T16:00:00.000Z',
	u: {
		_id: '123',
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
	t: 'some-system-message' as MessageTypesValues,
};
