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
						parameters: [
							{
								schema: {
									type: 'object',
									properties: { updatedSince: { type: 'string' } },
									additionalProperties: { type: 'string', nullable: true },
								},
							},
						],
					},
				},
				'/api/v1/channels.create': {
					post: {
						tags: ['Missing Documentation'],
						requestBody: {
							content: {
								'application/json': {
									schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
								},
							},
						},
					},
				},
				'/api/v1/channels.list.joined': {
					get: {
						tags: ['Missing Documentation'],
						parameters: [{ schema: { type: 'object', properties: { count: { type: 'number' } } } }],
					},
				},
				'/api/v1/rooms.isMember': {
					get: {
						tags: ['Rooms'],
						parameters: [
							{
								schema: {
									type: 'object',
									properties: {
										roomId: { type: 'string' },
										userId: { type: 'string' },
										username: { type: 'string' },
									},
									oneOf: [
										{ type: 'object', required: ['roomId', 'userId'] },
										{ type: 'object', required: ['roomId', 'username'] },
									],
									additionalProperties: false,
								},
							},
						],
					},
				},
				'/api/v1/teams.listRoomsOfUser': {
					get: {
						tags: ['Teams'],
						parameters: [
							{
								schema: {
									type: 'object',
									properties: {
										teamId: { type: 'string' },
										teamName: { type: 'string' },
										userId: { type: 'string' },
									},
									oneOf: [
										{ type: 'object', required: ['teamId'] },
										{ type: 'object', required: ['teamName'] },
									],
									required: ['userId'],
									additionalProperties: false,
								},
							},
						],
					},
				},
				'/api/v1/dm.files': {
					get: {
						tags: ['DM'],
						parameters: [
							{
								schema: {
									oneOf: [
										{
											type: 'object',
											properties: { thisIsAnExtremelyLongDiscriminatorNameThatEndsInAlpha: { type: 'string' } },
											required: ['thisIsAnExtremelyLongDiscriminatorNameThatEndsInAlpha'],
										},
										{
											type: 'object',
											properties: { thisIsAnExtremelyLongDiscriminatorNameThatEndsInBeta: { type: 'string' } },
											required: ['thisIsAnExtremelyLongDiscriminatorNameThatEndsInBeta'],
										},
									],
								},
							},
						],
					},
				},
				'/api/v1/users.delete': {
					post: {
						tags: ['Users'],
						requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
					},
				},
				'/api/v1/users.register': {
					post: {
						tags: ['Users'],
						requestBody: {
							content: {
								'application/json': {
									schema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] },
								},
							},
						},
					},
				},
			},
		},
	},
}));

describe('MCP tool catalog', () => {
	it('creates one curated tool per discriminated request variant', () => {
		const tools = getCuratedTools();

		expect(tools.map(({ name }) => name)).toEqual([
			'post_chat_postMessage_by_roomId',
			'post_chat_postMessage_by_channel',
			'post_channels_create',
			'get_channels_list_joined',
			'get_rooms_get',
		]);
		expect(tools[0]?.inputSchema).toEqual({
			type: 'object',
			description: 'Post by room id',
			properties: { roomId: { type: 'string' }, text: { type: 'string' } },
			required: ['roomId'],
		});
		expect(tools[4]?.inputSchema).toMatchObject({ additionalProperties: { type: 'string' } });
	});

	it('only exposes allow-listed routes in the extended catalog', () => {
		const tools = getExtendedTools();

		expect(tools.map(({ name }) => name)).toEqual(
			expect.arrayContaining([
				'post_chat_postMessage_by_roomId',
				'post_chat_postMessage_by_channel',
				'post_channels_create',
				'get_channels_list_joined',
				'get_rooms_get',
				'get_rooms_isMember_by_roomId_userId',
				'get_rooms_isMember_by_roomId_username',
			]),
		);
		expect(tools.some(({ name }) => name.includes('users_delete'))).toBe(false);
		expect(tools.some(({ name }) => name.includes('users_register'))).toBe(false);
	});

	it('keeps curated tool names stable when the extended catalog is enabled', () => {
		const extendedNames = new Set(getExtendedTools().map(({ name }) => name));

		expect(getCuratedTools().every(({ name }) => extendedNames.has(name))).toBe(true);
	});

	it('generates unique valid names when variant discriminators exceed the MCP limit', () => {
		const tools = getExtendedTools();
		const names = tools.map(({ name }) => name);
		const dmFileNames = tools.filter(({ path }) => path === '/api/v1/dm.files').map(({ name }) => name);

		expect(dmFileNames).toHaveLength(2);
		expect(new Set(names).size).toBe(names.length);
		expect(names.every((name) => name.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(name))).toBe(true);
	});

	it('preserves parent properties when variants only declare required fields', () => {
		const tools = getExtendedTools().filter(({ name }) => name.startsWith('get_rooms_isMember'));

		for (const { inputSchema } of tools) {
			const properties = inputSchema.properties as Record<string, unknown>;
			for (const requiredProperty of inputSchema.required as string[]) {
				expect(properties).toHaveProperty(requiredProperty);
			}
		}
	});

	it('preserves shared required fields without changing variant discriminators', () => {
		const tools = getExtendedTools().filter(({ name }) => name.startsWith('get_teams_listRoomsOfUser'));

		expect(tools.map(({ name }) => name)).toEqual(['get_teams_listRoomsOfUser_by_teamId', 'get_teams_listRoomsOfUser_by_teamName']);
		for (const { inputSchema } of tools) {
			expect(inputSchema.required).toEqual(expect.arrayContaining(['userId']));
		}
	});

	it('reuses the generated catalogs between requests', () => {
		expect(getCuratedTools()).toBe(getCuratedTools());
		expect(getExtendedTools()).toBe(getExtendedTools());
	});
});
