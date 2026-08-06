import { getCuratedTools, getExtendedTools } from './catalog';

jest.mock('../../../../server/api', () => ({
	API: {
		api: {
			typedRoutes: {
				'/api/v1/chat.postMessage': {
					post: {
						tags: ['Chat'],
						requestBody: {
							content: {
								'application/json': {
									schema: {
										oneOf: [
											{
												type: 'object',
												description: 'Post by room id',
												properties: { roomId: { type: 'string' }, text: { type: 'string', nullable: true } },
												required: ['roomId'],
											},
											{
												type: 'object',
												description: 'Post by channel',
												properties: { channel: { type: 'string' }, text: { type: 'string', nullable: true } },
												required: ['channel'],
											},
										],
									},
								},
							},
						},
					},
				},
				'/api/v1/rooms.get': {
					get: {
						tags: ['Rooms'],
						parameters: [{ schema: { type: 'object', properties: { updatedSince: { type: 'string' } } } }],
					},
				},
				'/api/v1/users.delete': {
					post: {
						tags: ['Users'],
						requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
					},
				},
			},
		},
	},
}));

describe('MCP tool catalog', () => {
	it('creates one curated tool per discriminated request variant', () => {
		const tools = getCuratedTools();

		expect(tools.map(({ name }) => name)).toEqual(['chat_postMessage_by_roomId', 'chat_postMessage_by_channel', 'rooms_get']);
		expect(tools[0]?.inputSchema).toEqual({
			type: 'object',
			description: 'Post by room id',
			properties: { roomId: { type: 'string' }, text: { type: 'string' } },
			required: ['roomId'],
		});
	});

	it('only exposes allow-listed routes in the extended catalog', () => {
		const tools = getExtendedTools();

		expect(tools.map(({ name }) => name)).toEqual(['post_chat_postMessage_by_roomId', 'post_chat_postMessage_by_channel', 'get_rooms_get']);
		expect(tools.some(({ name }) => name.includes('users_delete'))).toBe(false);
	});

	it('reuses the generated catalogs between requests', () => {
		expect(getCuratedTools()).toBe(getCuratedTools());
		expect(getExtendedTools()).toBe(getExtendedTools());
	});
});
