import { buildForwardChatRequest, getForwardChatFieldStates } from './forwardChat';

describe('buildForwardChatRequest', () => {
	it('sends the chat to a department', () => {
		expect(buildForwardChatRequest('room-id', { departmentId: 'support' })).toEqual({
			roomId: 'room-id',
			departmentId: 'support',
			comment: undefined,
			clientAction: true,
		});
	});

	it('sends the chat to an agent', () => {
		expect(buildForwardChatRequest('room-id', { userId: 'agent-id', comment: 'over to you' })).toEqual({
			roomId: 'room-id',
			userId: 'agent-id',
			comment: 'over to you',
			clientAction: true,
		});
	});

	it('refuses a chat aimed at a department and an agent at once', () => {
		expect(buildForwardChatRequest('room-id', { departmentId: 'support', userId: 'agent-id' })).toBeNull();
	});

	it('carries neither key when neither target was given', () => {
		const request = buildForwardChatRequest('room-id', {});

		expect(request).not.toBeNull();
		expect(request).not.toHaveProperty('departmentId');
		expect(request).not.toHaveProperty('userId');
	});
});

describe('getForwardChatFieldStates', () => {
	it('offers both targets while neither is chosen, but forwards to nowhere', () => {
		expect(getForwardChatFieldStates({})).toEqual({ canPickDepartment: true, canPickAgent: true, canForward: false });
	});

	it('closes off the agent once a department is chosen', () => {
		expect(getForwardChatFieldStates({ department: 'support' })).toEqual({
			canPickDepartment: true,
			canPickAgent: false,
			canForward: true,
		});
	});

	it('closes off the department once an agent is chosen', () => {
		expect(getForwardChatFieldStates({ username: 'rocket.cat' })).toEqual({
			canPickDepartment: false,
			canPickAgent: true,
			canForward: true,
		});
	});
});
