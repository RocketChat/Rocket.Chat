const mockLicenseHasModule = jest.fn();
const mockSettingsGet = jest.fn();
const mockMessagesFindVisibleByIds = jest.fn();
const mockRoomsFindByIds = jest.fn();
const mockRoomsFindOneByNameOrFname = jest.fn();
const mockSubscriptionsFindByUserId = jest.fn();
const mockSubscriptionsFindByUserIdAndRoomIds = jest.fn();
const mockUsersFindOneById = jest.fn();
const mockFetch = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	License: {
		hasModule: (...args: unknown[]) => mockLicenseHasModule(...args),
	},
	ServiceClass: class {
		protected name = '';
	},
	Settings: {
		get: (...args: unknown[]) => mockSettingsGet(...args),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	Messages: {
		findVisibleByIds: (...args: unknown[]) => mockMessagesFindVisibleByIds(...args),
	},
	Rooms: {
		findByIds: (...args: unknown[]) => mockRoomsFindByIds(...args),
		findOneByNameOrFname: (...args: unknown[]) => mockRoomsFindOneByNameOrFname(...args),
	},
	Subscriptions: {
		findByUserId: (...args: unknown[]) => mockSubscriptionsFindByUserId(...args),
		findByUserIdAndRoomIds: (...args: unknown[]) => mockSubscriptionsFindByUserIdAndRoomIds(...args),
	},
	Users: {
		findOneById: (...args: unknown[]) => mockUsersFindOneById(...args),
	},
}));

jest.mock('@rocket.chat/server-fetch', () => ({
	serverFetch: (...args: unknown[]) => mockFetch(...args),
}));

jest.mock('../../lib/logger/system', () => ({
	SystemLogger: {
		debug: jest.fn(),
		warn: jest.fn(),
	},
}));

// eslint-disable-next-line import/first
import { AISearchService } from './service';

type CursorResult<T> = {
	toArray(): Promise<T[]>;
};

const cursor = <T>(items: T[]): CursorResult<T> => ({
	toArray: async () => items,
});

const settings: Record<string, unknown> = {
	AI_Intelligent_Search_Enabled: true,
	AI_Intelligent_Search_Pipeline_Base_URL: 'https://pipeline.example.com',
	AI_Intelligent_Search_Pipeline_ID: 'workspace',
	AI_Intelligent_Search_API_Key: 'key',
	AI_Intelligent_Search_API_Key_Secret: 'secret',
	AI_Intelligent_Search_Query_Template: '',
	AI_Intelligent_Search_Min_Similarity_Percent: 61,
	AI_Intelligent_Search_Answer_Enabled: true,
	AI_LLM_OpenAI_Base_URL: 'https://llm.example.com',
	AI_LLM_OpenAI_API_Key: 'llm-key',
	AI_LLM_OpenAI_Model: 'gpt-test',
	AI_Intelligent_Search_Answer_System_Prompt: 'Use sources only.',
};

const createService = (): AISearchService => new AISearchService();

describe('AISearchService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockLicenseHasModule.mockResolvedValue(true);
		mockSettingsGet.mockImplementation(async (key: string) => settings[key]);
		mockUsersFindOneById.mockResolvedValue({ roles: ['admin'] });
		mockRoomsFindByIds.mockImplementation((roomIds: string[]) =>
			cursor(
				roomIds.map((roomId) => ({
					_id: roomId,
					t: 'c',
					name: roomId === 'allowed' ? 'general' : roomId,
					fname: roomId === 'allowed' ? 'General' : roomId,
				})),
			),
		);
		mockSubscriptionsFindByUserIdAndRoomIds.mockImplementation((_userId: string, roomIds: string[]) =>
			cursor(roomIds.filter((roomId) => roomId === 'allowed' || roomId === 'room-general').map((rid) => ({ rid }))),
		);
		mockMessagesFindVisibleByIds.mockImplementation((msgIds: string[]) =>
			cursor(
				msgIds.map((msgId) => ({
					_id: msgId,
					rid: msgId === 'blocked-msg' ? 'blocked' : 'allowed',
					msg: `${msgId} from db`,
					ts: new Date('2026-01-05T12:00:00.000Z'),
					u: { username: 'alice', name: 'Alice' },
				})),
			),
		);
	});

	describe('status', () => {
		it('reports availability from license, settings, pipeline, and LLM configuration', async () => {
			await expect(createService().status()).resolves.toEqual({
				hasIntelligentSearchLicense: true,
				intelligentSearchEnabled: true,
				intelligentSearchConfigured: true,
				answerGenerationConfigured: true,
			});
		});

		it('marks answer generation unavailable when the answer setting is off', async () => {
			mockSettingsGet.mockImplementation(async (key: string) => (key === 'AI_Intelligent_Search_Answer_Enabled' ? false : settings[key]));

			await expect(createService().status()).resolves.toMatchObject({
				answerGenerationConfigured: false,
			});
		});
	});

	describe('search', () => {
		it('does not call the pipeline when license, setting, or configuration is unavailable', async () => {
			mockLicenseHasModule.mockResolvedValue(false);

			await expect(createService().search({ query: 'fruit', userId: 'user-id' })).resolves.toEqual([]);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it('uses bounded overfetch and post-filters accessible rooms for broad searches', async () => {
			mockSubscriptionsFindByUserId.mockReturnValue(cursor(Array.from({ length: 1001 }, (_, index) => ({ rid: `room-${index}` }))));
			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({
					results: [
						{ metadata: { room_id: 'blocked', msg_id: 'blocked-msg' }, text: 'blocked pipeline text', score: 0.1 },
						{ metadata: { room_id: 'allowed', msg_id: 'allowed-msg' }, text: 'allowed pipeline text', score: 0.39 },
					],
				}),
				text: async () => '',
			});

			const results = await createService().search({ query: 'fruit', userId: 'user-id', limit: 5 });

			expect(results).toEqual([
				{
					_id: 'allowed-msg',
					rid: 'allowed',
					msgId: 'allowed-msg',
					text: 'allowed-msg from db',
					ts: new Date('2026-01-05T12:00:00.000Z'),
					u: { username: 'alice', name: 'Alice' },
					score: 0.61,
					room: { _id: 'allowed', t: 'c', name: 'general', fname: 'General' },
				},
			]);

			const [, options] = mockFetch.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.params.k).toBe(50);
			expect(body.filters).toEqual({});
			expect(mockSubscriptionsFindByUserId).toHaveBeenCalledWith('user-id', {
				projection: { rid: 1 },
				limit: 1001,
			});
			expect(mockSubscriptionsFindByUserIdAndRoomIds).toHaveBeenCalledWith('user-id', expect.arrayContaining(['blocked', 'allowed']), {
				projection: { rid: 1 },
			});
		});

		it('resolves room-name filters before querying the pipeline', async () => {
			mockRoomsFindOneByNameOrFname.mockResolvedValue({ _id: 'room-general' });
			mockSubscriptionsFindByUserId.mockReturnValue(cursor([{ rid: 'room-general' }]));
			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({
					results: [
						{ metadata: { room_id: 'room-general', msg_id: 'general-msg' }, text: 'general pipeline text', similarity: 0.8 },
						{ metadata: { room_id: 'blocked', msg_id: 'blocked-msg' }, text: 'blocked pipeline text', similarity: 0.99 },
					],
				}),
				text: async () => '',
			});
			mockMessagesFindVisibleByIds.mockReturnValue(
				cursor([
					{
						_id: 'general-msg',
						rid: 'room-general',
						msg: 'general message from db',
						ts: new Date('2026-01-05T12:00:00.000Z'),
						u: { username: 'alice', name: 'Alice' },
					},
				]),
			);
			mockRoomsFindByIds.mockReturnValue(cursor([{ _id: 'room-general', t: 'c', name: 'general', fname: 'General' }]));

			const results = await createService().search({
				query: 'fruit',
				userId: 'user-id',
				filters: {
					roomNames: ['general'],
					fromUsernames: ['alice'],
					startDate: '2026-01-01T00:00:00.000Z',
					endDate: '2026-01-31T00:00:00.000Z',
				},
				limit: 5,
			});

			expect(results).toHaveLength(1);
			expect(results[0]).toMatchObject({ _id: 'general-msg', rid: 'room-general', score: 0.8 });
			expect(mockMessagesFindVisibleByIds).toHaveBeenCalledWith(['general-msg'], {
				projection: { _id: 1, rid: 1, msg: 1, ts: 1, u: 1 },
			});

			const [, options] = mockFetch.mock.calls[0];
			expect(JSON.parse(options.body).filters).toEqual({
				room_id: { $eq: 'room-general' },
				username: { $eq: 'alice' },
				timestamp: {
					$ge: '2026-01-01T00:00:00.000Z',
					$le: '2026-01-31T00:00:00.000Z',
				},
			});
		});
	});

	describe('answer', () => {
		it('rejects answer generation when AI Search or answer generation is unavailable', async () => {
			mockSettingsGet.mockImplementation(async (key: string) => (key === 'AI_Intelligent_Search_Answer_Enabled' ? false : settings[key]));

			await expect(createService().answer({ query: 'fruit', messages: [{ text: 'oranges are green' }] })).rejects.toThrow(
				'error-ai-not-enabled',
			);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it('generates an answer from source messages with the configured LLM provider', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ choices: [{ message: { content: 'Oranges are green.' } }] }),
				text: async () => '',
			});

			await expect(
				createService().answer({
					query: 'fruit colors',
					messages: [{ text: 'oranges are green', username: 'alice', roomName: 'general', score: 0.61 }],
				}),
			).resolves.toEqual({
				answer: 'Oranges are green.',
				provider: { name: 'OpenAI compatible', model: 'gpt-test' },
			});

			const [url, options] = mockFetch.mock.calls[0];
			expect(url).toBe('https://llm.example.com/chat/completions');
			expect(options.headers.Authorization).toBe('Bearer llm-key');
			expect(JSON.parse(options.body).messages[0]).toEqual({ role: 'system', content: 'Use sources only.' });
		});
	});
});
