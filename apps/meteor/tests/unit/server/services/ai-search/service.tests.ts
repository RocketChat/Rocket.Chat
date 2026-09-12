import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const License = {
	hasModule: sinon.stub(),
};

const cachedSettings = {
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
	},
	'../../settings': {
		settings: cachedSettings,
	},
	'@rocket.chat/logger': {
		Logger: class {
			debug = sinon.stub();

			warn = sinon.stub();
		},
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
});

type CursorResult<T> = {
	toArray(): Promise<T[]>;
	map<U>(callback: (item: T) => U): CursorResult<U>;
};

const cursor = <T>(items: T[]): CursorResult<T> => ({
	toArray: async () => items,
	map: (callback) => cursor(items.map(callback)),
});

const settings: Record<string, unknown> = {
	AI_Intelligent_Search_Enabled: true,
	AI_Intelligent_Search_Semantic_Weight: 100,
	AI_Intelligent_Search_Recency_Weight: 0,
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
	SSRF_Allowlist: 'pipeline.example.com,llm.example.com',
};

const createService = (): InstanceType<typeof AISearchService> => new AISearchService();

describe('AISearchService', () => {
	beforeEach(() => {
		License.hasModule.reset();
		cachedSettings.get.reset();
		Messages.findVisibleByIds.reset();
		Rooms.findByIds.reset();
		Rooms.findOneByNameOrFname.reset();
		Subscriptions.findByUserId.reset();
		Subscriptions.findByUserIdAndRoomIds.reset();
		Users.findOneById.reset();
		serverFetch.reset();

		License.hasModule.resolves(true);
		cachedSettings.get.callsFake((key: string) => settings[key]);
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
		Subscriptions.findByUserId.callsFake(() => cursor([{ rid: 'allowed' }]));
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
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Answer_Enabled' ? false : settings[key]));

			expect(await createService().status()).to.include({
				answerGenerationConfigured: false,
			});
		});

		it('marks answer generation unavailable when the pipeline is not configured', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Pipeline_Base_URL' ? '' : settings[key]));

			expect(await createService().status()).to.include({
				intelligentSearchConfigured: false,
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

		it('sends subscribed room scope to the pipeline for broad searches', async () => {
			const subscribedRoomIds = [...Array.from({ length: 1001 }, (_, index) => `room-${index}`), 'allowed'];
			Subscriptions.findByUserId.returns(cursor([...subscribedRoomIds.map((rid) => ({ rid })), { rid: 'banned-room', status: 'BANNED' }]));
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
					ts: '2026-01-05T12:00:00.000Z',
					u: { username: 'alice', name: 'Alice' },
					score: 0.61,
					room: { _id: 'allowed', t: 'c', name: 'general', fname: 'General' },
				},
			]);

			const [, options] = serverFetch.firstCall.args;
			const body = JSON.parse(options.body);
			// the retriever is asked for a candidate pool, not the requested page
			expect(body.params.k).to.equal(20);
			expect(body.filters).to.deep.equal({
				room_id: { $in: subscribedRoomIds },
			});
			expect(options).to.include({
				ignoreSsrfValidation: false,
				allowList: 'pipeline.example.com,llm.example.com',
			});
			expect(
				Subscriptions.findByUserId.calledWith('user-id', {
					projection: { rid: 1, status: 1 },
				}),
			).to.be.true;
			expect(
				Subscriptions.findByUserIdAndRoomIds.calledWith('user-id', ['blocked', 'allowed'], {
					projection: { rid: 1, status: 1 },
				}),
			).to.be.true;
		});

		it('uses explicit searchType keyword when requested', async () => {
			serverFetch.resolves({
				ok: true,
				status: 200,
				json: async () => ({
					results: [{ metadata: { room_id: 'allowed', msg_id: 'allowed-msg' }, text: 'keyword pipeline text', score: 0.77 }],
				}),
				text: async () => '',
			});

			await createService().search({
				query: 'fruit',
				userId: 'user-id',
				limit: 5,
				searchType: 'keyword',
			});

			const requestBody = JSON.parse(serverFetch.firstCall.args[1].body);
			expect(requestBody.type).to.equal('search');
			expect(requestBody.classification).to.deep.equal({ classifications: ['user', 'admin'], search_type: 1 });
			expect(requestBody.params).to.not.have.property('threshold');
		});

		it('queries only the keyword retriever when the balance is 0', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 0 : settings[key]));
			serverFetch.resolves({
				ok: true,
				status: 200,
				json: async () => ({
					results: [{ metadata: { room_id: 'allowed', msg_id: 'keyword-msg' }, text: 'keyword text', score: 0.9 }],
				}),
				text: async () => '',
			});

			await createService().search({ query: 'fruit', userId: 'user-id' });

			expect(serverFetch.callCount).to.equal(1);
			const requestBody = JSON.parse(serverFetch.firstCall.args[1].body);
			expect(requestBody.type).to.equal('search');
		});

		it('queries only the semantic retriever when the balance is 100', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 100 : settings[key]));
			serverFetch.resolves({
				ok: true,
				status: 200,
				json: async () => ({
					results: [{ metadata: { room_id: 'allowed', msg_id: 'semantic-msg' }, text: 'semantic text', score: 0.88 }],
				}),
				text: async () => '',
			});

			await createService().search({ query: 'fruit', userId: 'user-id' });

			expect(serverFetch.callCount).to.equal(1);
			const requestBody = JSON.parse(serverFetch.firstCall.args[1].body);
			expect(requestBody.type).to.equal('similarity');
			expect(requestBody.params).to.have.property('threshold');
		});

		it('uses weighted hybrid with semantic threshold filtering only on semantic branch', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 50 : settings[key]));

			serverFetch.reset();
			serverFetch
				.onCall(0)
				.resolves({
					ok: true,
					status: 200,
					json: async () => ({
						results: [
							{ metadata: { room_id: 'allowed', msg_id: 'allowed-msg' }, text: 'semantic good', score: 0.2 },
							{ metadata: { room_id: 'allowed', msg_id: 'filtered-msg' }, text: 'semantic filtered', score: 0.49 },
						],
					}),
					text: async () => '',
				})
				.onCall(1)
				.resolves({
					ok: true,
					status: 200,
					json: async () => ({
						results: [{ metadata: { room_id: 'allowed', msg_id: 'keyword-msg' }, text: 'keyword text', score: 0.4 }],
					}),
					text: async () => '',
				});

			const results = await createService().search({ query: 'fruit', userId: 'user-id', limit: 5 });

			expect(serverFetch.callCount).to.equal(2);
			expect(results).to.deep.equal([
				{
					_id: 'allowed-msg',
					rid: 'allowed',
					msgId: 'allowed-msg',
					text: 'allowed-msg from db',
					ts: '2026-01-05T12:00:00.000Z',
					u: { username: 'alice', name: 'Alice' },
					score: 0.8,
					room: { _id: 'allowed', t: 'c', name: 'general', fname: 'General' },
				},
				{
					// keyword-sourced: carries no similarity, because the pipeline's full-text rank is not one
					_id: 'keyword-msg',
					rid: 'allowed',
					msgId: 'keyword-msg',
					text: 'keyword-msg from db',
					ts: '2026-01-05T12:00:00.000Z',
					u: { username: 'alice', name: 'Alice' },
					room: { _id: 'allowed', t: 'c', name: 'general', fname: 'General' },
				},
			]);
		});

		it('scales the candidate pool with the requested page and caps it', async () => {
			serverFetch.resolves({ ok: true, status: 200, json: async () => ({ results: [] }), text: async () => '' });

			const service = createService();
			await service.search({ query: 'fruit', userId: 'user-id', limit: 9 });
			expect(JSON.parse(serverFetch.lastCall.args[1].body).params.k).to.equal(27);

			// the cap stays above the largest page so permission filtering cannot shorten it
			await service.search({ query: 'fruit', userId: 'user-id', limit: 50 });
			expect(JSON.parse(serverFetch.lastCall.args[1].body).params.k).to.equal(100);
		});

		it('keeps a full page of hybrid results when fusion candidates are not visible', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 50 : settings[key]));
			// only the last two candidates resolve to a visible message
			Messages.findVisibleByIds.callsFake((msgIds: string[]) =>
				cursor(
					msgIds
						.filter((msgId) => msgId === 'visible-a' || msgId === 'visible-b')
						.map((msgId) => ({
							_id: msgId,
							rid: 'allowed',
							msg: `${msgId} from db`,
							ts: new Date('2026-01-05T12:00:00.000Z'),
							u: { username: 'alice', name: 'Alice' },
						})),
				),
			);
			const semanticResults = [
				{ metadata: { room_id: 'allowed', msg_id: 'hidden-1' }, score: 0.2 },
				{ metadata: { room_id: 'allowed', msg_id: 'hidden-2' }, score: 0.25 },
				{ metadata: { room_id: 'allowed', msg_id: 'visible-a' }, score: 0.3 },
			];
			const keywordResults = [{ metadata: { room_id: 'allowed', msg_id: 'visible-b' }, score: 0.4 }];
			serverFetch.reset();
			serverFetch
				.onCall(0)
				.resolves({ ok: true, status: 200, json: async () => ({ results: semanticResults }), text: async () => '' })
				.onCall(1)
				.resolves({ ok: true, status: 200, json: async () => ({ results: keywordResults }), text: async () => '' });

			const results = await createService().search({ query: 'fruit', userId: 'user-id', limit: 2 });

			expect(results.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['visible-b', 'visible-a']);
		});

		it('retains the other branch beyond the candidate cap when higher-ranked messages are inaccessible', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 90 : settings[key]));
			serverFetch.callsFake(async (_url: string, options: { body: string }) => {
				const { type, params } = JSON.parse(options.body);
				const results = Array.from({ length: params.k }, (_, index) => ({
					metadata: { room_id: type === 'similarity' ? 'forbidden' : 'allowed', msg_id: `${type}-${index}` },
					score: 0.2,
				}));
				return { ok: true, status: 200, json: async () => ({ results }), text: async () => '' };
			});
			Messages.findVisibleByIds.callsFake((msgIds: string[]) =>
				cursor(msgIds.map((_id) => ({ _id, rid: _id.startsWith('similarity-') ? 'forbidden' : 'allowed', msg: _id }))),
			);

			const results = await createService().search({ query: 'fruit', userId: 'user-id', limit: 2 });

			expect(results.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['search-0', 'search-1']);
		});

		it('promotes fresher messages once the recency boost is enabled', async () => {
			const timestamps: Record<string, string> = {
				stale: '2020-01-01T12:00:00.000Z',
				fresh: new Date().toISOString(),
			};
			Messages.findVisibleByIds.callsFake((msgIds: string[]) =>
				cursor(
					msgIds.map((msgId) => ({
						_id: msgId,
						rid: 'allowed',
						msg: `${msgId} from db`,
						ts: new Date(timestamps[msgId]),
						u: { username: 'alice', name: 'Alice' },
					})),
				),
			);
			const pipelineResults = {
				results: [
					{ metadata: { room_id: 'allowed', msg_id: 'stale', timestamp: timestamps.stale }, score: 0.2 },
					{ metadata: { room_id: 'allowed', msg_id: 'fresh', timestamp: timestamps.fresh }, score: 0.21 },
				],
			};
			serverFetch.resolves({ ok: true, status: 200, json: async () => pipelineResults, text: async () => '' });

			const withoutBoost = await createService().search({ query: 'fruit', userId: 'user-id', limit: 5 });
			expect(withoutBoost.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['stale', 'fresh']);

			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Recency_Weight' ? 100 : settings[key]));
			const withBoost = await createService().search({ query: 'fruit', userId: 'user-id', limit: 5 });
			expect(withBoost.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['fresh', 'stale']);
		});

		it('serves the surviving retriever when one hybrid branch fails', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 50 : settings[key]));
			serverFetch.reset();
			serverFetch
				.onCall(0)
				.resolves({
					ok: true,
					status: 200,
					json: async () => ({ results: [{ metadata: { room_id: 'allowed', msg_id: 'allowed-msg' }, score: 0.2 }] }),
					text: async () => '',
				})
				.onCall(1)
				.rejects(new Error('keyword branch timed out'));

			const results = await createService().search({ query: 'fruit', userId: 'user-id', limit: 5 });

			expect(results.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['allowed-msg']);
		});

		it('gives up only when both hybrid branches fail', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 50 : settings[key]));
			serverFetch.reset();
			serverFetch.rejects(new Error('pipeline unreachable'));

			await createService()
				.search({ query: 'fruit', userId: 'user-id', limit: 5 })
				.then(
					() => expect.fail('expected the search to reject'),
					(error: Error) => expect(error.message).to.equal('pipeline unreachable'),
				);
		});

		for (const failedType of ['similarity', 'search']) {
			it(`serves the surviving retriever when ${failedType} returns HTTP 503`, async () => {
				cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 50 : settings[key]));
				serverFetch.callsFake(async (_url: string, options: { body: string }) => {
					const failed = JSON.parse(options.body).type === failedType;
					return {
						ok: !failed,
						status: failed ? 503 : 200,
						json: async () => ({ results: [{ id: 'allowed-msg', score: 0.2 }] }),
						text: async () => '',
					};
				});

				const results = await createService().search({ query: 'fruit', userId: 'user-id' });

				expect(results.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['allowed-msg']);
			});
		}

		it('rejects when both retrievers return HTTP errors', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 50 : settings[key]));
			serverFetch.resolves({ ok: false, status: 503, text: async () => '' });

			await createService()
				.search({ query: 'fruit', userId: 'user-id' })
				.then(
					() => expect.fail('expected the search to reject'),
					(error: Error) => expect(error.message).to.equal('Intelligent search pipeline returned HTTP 503'),
				);
		});

		it('lets an explicit searchType pin an endpoint of the balance without an admin change', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Semantic_Weight' ? 50 : settings[key]));
			serverFetch.resolves({
				ok: true,
				status: 200,
				json: async () => ({ results: [{ metadata: { room_id: 'allowed', msg_id: 'allowed-msg' }, score: 0.2 }] }),
				text: async () => '',
			});

			const service = createService();
			await service.search({ query: 'fruit', userId: 'user-id', searchType: 'semantic' });
			expect(serverFetch.callCount).to.equal(1);
			expect(JSON.parse(serverFetch.lastCall.args[1].body).type).to.equal('similarity');

			serverFetch.resetHistory();
			await service.search({ query: 'fruit', userId: 'user-id', searchType: 'keyword' });
			expect(serverFetch.callCount).to.equal(1);
			expect(JSON.parse(serverFetch.lastCall.args[1].body).type).to.equal('search');

			serverFetch.resetHistory();
			await service.search({ query: 'fruit', userId: 'user-id', searchType: 'hybrid' });
			expect(serverFetch.callCount).to.equal(2);
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
				Messages.findVisibleByIds.calledWith(['general-msg', 'blocked-msg'], {
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

		it('returns no results when room-name filters do not resolve to subscribed rooms', async () => {
			Rooms.findOneByNameOrFname.resolves(null);

			expect(
				await createService().search({ query: 'fruit', userId: 'user-id', filters: { roomNames: ['unknown-room'] }, limit: 5 }),
			).to.deep.equal([]);
			expect(serverFetch.called).to.be.false;
		});

		it('drops pipeline hits that do not reference a message', async () => {
			Subscriptions.findByUserId.returns(cursor([{ rid: 'allowed' }]));
			serverFetch.resolves({
				ok: true,
				status: 200,
				json: async () => ({
					results: [{ metadata: { room_id: 'allowed' }, text: 'index text without a message reference', score: 0.1 }],
				}),
				text: async () => '',
			});

			expect(await createService().search({ query: 'fruit', userId: 'user-id', limit: 5 })).to.deep.equal([]);
		});

		it('drops pipeline hits when the referenced message is not visible', async () => {
			Subscriptions.findByUserId.returns(cursor([{ rid: 'allowed' }]));
			serverFetch.resolves({
				ok: true,
				status: 200,
				json: async () => ({
					results: [{ metadata: { room_id: 'allowed', msg_id: 'hidden-msg' }, text: 'pipeline text should not leak', score: 0.1 }],
				}),
				text: async () => '',
			});
			Messages.findVisibleByIds.returns(cursor([]));

			expect(await createService().search({ query: 'fruit', userId: 'user-id', limit: 5 })).to.deep.equal([]);
		});

		it('drops pipeline hits from rooms where the user subscription is banned', async () => {
			Subscriptions.findByUserId.returns(cursor([{ rid: 'allowed' }]));
			Subscriptions.findByUserIdAndRoomIds.returns(cursor([{ rid: 'allowed', status: 'BANNED' }]));
			serverFetch.resolves({
				ok: true,
				status: 200,
				json: async () => ({
					results: [{ metadata: { room_id: 'allowed', msg_id: 'allowed-msg' }, text: 'pipeline text', similarity: 0.8 }],
				}),
				text: async () => '',
			});

			expect(await createService().search({ query: 'fruit', userId: 'user-id', limit: 5 })).to.deep.equal([]);
		});
	});

	describe('answer', () => {
		it('rejects answer generation when AI Search or answer generation is unavailable', async () => {
			cachedSettings.get.callsFake((key: string) => (key === 'AI_Intelligent_Search_Answer_Enabled' ? false : settings[key]));

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

	describe('models', () => {
		it('does not contact the provider without the AI add-on', async () => {
			License.hasModule.resolves(false);

			expect(await createService().models()).to.deep.equal([]);
			expect(serverFetch.called).to.be.false;
		});
	});
});
