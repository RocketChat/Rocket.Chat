import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const License = {
	hasModule: sinon.stub(),
};

const Settings = {
	get: sinon.stub(),
};

const Messages = {
	findVisibleByIds: sinon.stub(),
};

const Rooms = {
	findByIds: sinon.stub(),
	findOneByNameOrFname: sinon.stub(),
};

const Subscriptions = {
	findByUserId: sinon.stub(),
	findByUserIdAndRoomIds: sinon.stub(),
};

const Users = {
	findOneById: sinon.stub(),
};

const serverFetch = sinon.stub();

const { AISearchService } = proxyquire.noCallThru().load('../../../../../server/services/ai-search/service', {
	'@rocket.chat/core-services': {
		License,
		ServiceClass: class {
			protected name = '';
		},
		Settings,
	},
	'@rocket.chat/models': {
		Messages,
		Rooms,
		Subscriptions,
		Users,
	},
	'@rocket.chat/server-fetch': {
		serverFetch,
	},
	'../../lib/logger/system': {
		SystemLogger: {
			debug: sinon.stub(),
			warn: sinon.stub(),
		},
	},
});

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

const createService = (): InstanceType<typeof AISearchService> => new AISearchService();

describe('AISearchService', () => {
	beforeEach(() => {
		License.hasModule.reset();
		Settings.get.reset();
		Messages.findVisibleByIds.reset();
		Rooms.findByIds.reset();
		Rooms.findOneByNameOrFname.reset();
		Subscriptions.findByUserId.reset();
		Subscriptions.findByUserIdAndRoomIds.reset();
		Users.findOneById.reset();
		serverFetch.reset();

		License.hasModule.resolves(true);
		Settings.get.callsFake(async (key: string) => settings[key]);
		Users.findOneById.resolves({ roles: ['admin'] });
		Rooms.findByIds.callsFake((roomIds: string[]) =>
			cursor(
				roomIds.map((roomId) => ({
					_id: roomId,
					t: 'c',
					name: roomId === 'allowed' ? 'general' : roomId,
					fname: roomId === 'allowed' ? 'General' : roomId,
				})),
			),
		);
		Subscriptions.findByUserIdAndRoomIds.callsFake((_userId: string, roomIds: string[]) =>
			cursor(roomIds.filter((roomId) => roomId === 'allowed' || roomId === 'room-general').map((rid) => ({ rid }))),
		);
		Messages.findVisibleByIds.callsFake((msgIds: string[]) =>
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
			expect(await createService().status()).to.deep.equal({
				hasIntelligentSearchLicense: true,
				intelligentSearchEnabled: true,
				intelligentSearchConfigured: true,
				answerGenerationConfigured: true,
			});
		});

		it('marks answer generation unavailable when the answer setting is off', async () => {
			Settings.get.callsFake(async (key: string) => (key === 'AI_Intelligent_Search_Answer_Enabled' ? false : settings[key]));

			expect(await createService().status()).to.include({
				answerGenerationConfigured: false,
			});
		});
	});

	describe('search', () => {
		it('does not call the pipeline when license, setting, or configuration is unavailable', async () => {
			License.hasModule.resolves(false);

			expect(await createService().search({ query: 'fruit', userId: 'user-id' })).to.deep.equal([]);
			expect(serverFetch.called).to.be.false;
		});

		it('uses bounded overfetch and post-filters accessible rooms for broad searches', async () => {
			Subscriptions.findByUserId.returns(cursor(Array.from({ length: 1001 }, (_, index) => ({ rid: `room-${index}` }))));
			serverFetch.resolves({
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

			expect(results).to.deep.equal([
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

			const [, options] = serverFetch.firstCall.args;
			const body = JSON.parse(options.body);
			expect(body.params.k).to.equal(50);
			expect(body.filters).to.deep.equal({});
			expect(
				Subscriptions.findByUserId.calledWith('user-id', {
					projection: { rid: 1 },
					limit: 1001,
				}),
			).to.be.true;
			expect(
				Subscriptions.findByUserIdAndRoomIds.calledWith(
					'user-id',
					sinon.match((roomIds: string[]) => roomIds.includes('blocked') && roomIds.includes('allowed')),
					{ projection: { rid: 1 } },
				),
			).to.be.true;
		});

		it('resolves room-name filters before querying the pipeline', async () => {
			Rooms.findOneByNameOrFname.resolves({ _id: 'room-general' });
			Subscriptions.findByUserId.returns(cursor([{ rid: 'room-general' }]));
			serverFetch.resolves({
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
			Messages.findVisibleByIds.returns(
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
			Rooms.findByIds.returns(cursor([{ _id: 'room-general', t: 'c', name: 'general', fname: 'General' }]));

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

			expect(results).to.have.lengthOf(1);
			expect(results[0]).to.include({ _id: 'general-msg', rid: 'room-general', score: 0.8 });
			expect(
				Messages.findVisibleByIds.calledWith(['general-msg'], {
					projection: { _id: 1, rid: 1, msg: 1, ts: 1, u: 1 },
				}),
			).to.be.true;

			const [, options] = serverFetch.firstCall.args;
			expect(JSON.parse(options.body).filters).to.deep.equal({
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
			Settings.get.callsFake(async (key: string) => (key === 'AI_Intelligent_Search_Answer_Enabled' ? false : settings[key]));

			try {
				await createService().answer({ query: 'fruit', messages: [{ text: 'oranges are green' }] });
				throw new Error('Expected answer generation to fail');
			} catch (error) {
				expect((error as Error).message).to.equal('error-ai-not-enabled');
			}
			expect(serverFetch.called).to.be.false;
		});

		it('generates an answer from source messages with the configured LLM provider', async () => {
			serverFetch.resolves({
				ok: true,
				status: 200,
				json: async () => ({ choices: [{ message: { content: 'Oranges are green.' } }] }),
				text: async () => '',
			});

			expect(
				await createService().answer({
					query: 'fruit colors',
					messages: [{ text: 'oranges are green', username: 'alice', roomName: 'general', score: 0.61 }],
				}),
			).to.deep.equal({
				answer: 'Oranges are green.',
				provider: { name: 'OpenAI compatible', model: 'gpt-test' },
			});

			const [url, options] = serverFetch.firstCall.args;
			expect(url).to.equal('https://llm.example.com/chat/completions');
			expect(options.headers.Authorization).to.equal('Bearer llm-key');
			expect(JSON.parse(options.body).messages[0]).to.deep.equal({ role: 'system', content: 'Use sources only.' });
		});
	});
});
