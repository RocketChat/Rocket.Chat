import { after, before, beforeEach, describe, it } from 'node:test';

import { AI_SEARCH_PAGE_SIZE, MAX_INTELLIGENT_SEARCH_RESULTS, MAX_SEARCH_FILTER_VALUES } from '@rocket.chat/ai-search';
import { ClientSafeError, LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IAISearchService, IAuthorization } from '@rocket.chat/core-services';
import type { IMessagesModel, IRoomsModel, ISubscriptionsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const status = sandbox.stub();
const search = sandbox.stub();
const answer = sandbox.stub();
const models = sandbox.stub();
const hasAtLeastOnePermission = sandbox.stub();
const hasAllPermission = sandbox.stub();
const normalizeMessages = sandbox.stub();

class AISearchDouble extends ServiceClass implements Pick<IAISearchService, 'status' | 'search' | 'answer' | 'models'> {
	protected name = 'ai-search';

	async status() {
		return status();
	}

	async search(...args: Parameters<IAISearchService['search']>) {
		return search(...args);
	}

	async answer(...args: Parameters<IAISearchService['answer']>) {
		return answer(...args);
	}

	async models() {
		return models();
	}
}

class AuthorizationDouble extends ServiceClass implements Pick<IAuthorization, 'hasAllPermission' | 'hasAtLeastOnePermission'> {
	protected name = 'authorization';

	async hasAllPermission(...args: Parameters<IAuthorization['hasAllPermission']>) {
		return hasAllPermission(...args);
	}

	async hasAtLeastOnePermission(...args: Parameters<IAuthorization['hasAtLeastOnePermission']>) {
		return hasAtLeastOnePermission(...args);
	}
}

const services = [new AISearchDouble(), new AuthorizationDouble()];

const routes: Record<string, (this: Record<string, unknown>) => Promise<any>> = {};
const routeOptions: Record<string, { authRequired?: boolean; rateLimiterOptions?: { numRequestsAllowed: number } }> = {};

const registerRoute = (path: string, options: (typeof routeOptions)[string], action: (typeof routes)[string]) => {
	routes[path] = action;
	routeOptions[path] = options;
};

proxyquire.noCallThru().load('./ai-search', {
	'../../lib/utils/lib/normalizeMessagesForUser': { normalizeMessagesForUser: normalizeMessages },
	'../api': {
		API: {
			v1: {
				get: registerRoute,
				post: registerRoute,
				success: (body: unknown) => ({ statusCode: 200, body }),
				forbidden: () => ({ statusCode: 403 }),
			},
		},
	},
});

const userId = 'user-id';

type FindOptions = { projection: Record<string, 1> };

const cursor = <T extends object>(docs: T[], { projection }: FindOptions) => ({
	toArray: async () => docs.map((doc) => Object.fromEntries(Object.entries(doc).filter(([field]) => field in projection))),
});

let visibleMessages: Record<string, unknown>[];
let subscriptions: { rid: string; u: { _id: string }; status?: string }[];

const findVisibleByIds = sandbox.spy((ids: string[], options: FindOptions) =>
	cursor(
		visibleMessages.filter(({ _id }) => ids.includes(_id as string)),
		options,
	),
);
const findByUserIdAndRoomIds = sandbox.spy((id: string, rids: string[], options: FindOptions) =>
	cursor(
		subscriptions.filter(({ u, rid }) => u._id === id && rids.includes(rid)),
		options,
	),
);
const findRoomsByIds = sandbox.spy((ids: string[], options: FindOptions) =>
	cursor(
		[
			{ _id: 'general', t: 'c', name: 'general', fname: 'General' },
			{ _id: 'sales', t: 'p', name: 'sales' },
		].filter(({ _id }) => ids.includes(_id)),
		options,
	),
);

const messageIn = (rid: string, _id: string) => ({
	_id,
	rid,
	msg: `text of ${_id}`,
	ts: new Date('2026-01-02T03:04:05.000Z'),
	u: { username: 'author' },
});

const subscriptionTo = (rid: string, subscriptionStatus?: string) => ({ rid, u: { _id: userId }, status: subscriptionStatus });

const requestAnswer = (messages: { _id: string; score?: number }[]) =>
	routes['ai.search.answer'].call({ userId, bodyParams: { query: 'what happened?', messages } });

const requestSearch = (queryParams: Record<string, unknown> = {}) =>
	routes['ai.search'].call({ userId, queryParams: { query: 'budget', ...queryParams }, logger: { warn: sandbox.stub() } });

const requestModels = () => routes['ai.llm.models'].call({ userId });

const expectRefused = async (request: Promise<unknown>, error: string) => {
	const refusal = await request.catch((e) => e);

	expect(refusal).to.be.instanceOf(ClientSafeError);
	expect(refusal).to.have.property('error', error);
};

describe('AI search endpoints', () => {
	before(() => {
		api.setBroker(new LocalBroker());
		services.forEach((service) => api.registerService(service));
		registerModel('IMessagesModel', { findVisibleByIds } as unknown as IMessagesModel);
		registerModel('IRoomsModel', { findByIds: findRoomsByIds } as unknown as IRoomsModel);
		registerModel('ISubscriptionsModel', { findByUserIdAndRoomIds } as unknown as ISubscriptionsModel);
	});

	after(async () => {
		await Promise.all(services.map((service) => api.destroyService(service)));
	});

	beforeEach(() => {
		sandbox.reset();
		visibleMessages = [messageIn('general', 'message-1')];
		subscriptions = [subscriptionTo('general')];
		normalizeMessages.callsFake(async (docs: unknown[]) => docs);
		status.resolves({
			hasIntelligentSearchLicense: true,
			intelligentSearchEnabled: true,
			intelligentSearchConfigured: true,
			answerGenerationConfigured: true,
		});
		answer.resolves({ answer: 'the answer', provider: { name: 'openai', model: 'gpt' } });
		search.resolves([]);
		hasAtLeastOnePermission.resolves(false);
		hasAllPermission.resolves(false);
	});

	it('should require a logged-in user and limit the rate on every route', () => {
		expect(Object.keys(routeOptions)).to.have.members(['ai.search', 'ai.llm.models', 'ai.search.answer']);
		for (const options of Object.values(routeOptions)) {
			expect(options.authRequired).to.be.true;
			expect(options.rateLimiterOptions?.numRequestsAllowed).to.be.greaterThan(0);
		}
	});

	describe('ai.search.answer', () => {
		for (const gate of ['hasIntelligentSearchLicense', 'intelligentSearchEnabled', 'answerGenerationConfigured']) {
			it(`should refuse before reading any message when ${gate} is false`, async () => {
				status.resolves({
					hasIntelligentSearchLicense: true,
					intelligentSearchEnabled: true,
					answerGenerationConfigured: true,
					[gate]: false,
				});

				await expectRefused(requestAnswer([{ _id: 'message-1' }]), 'error-ai-not-enabled');

				expect(findVisibleByIds.called).to.be.false;
				expect(answer.called).to.be.false;
			});
		}

		it('should answer from the sources the user can read', async () => {
			const result = await requestAnswer([{ _id: 'message-1', score: 0.5 }]);

			expect(result.body).to.deep.equal({ answer: 'the answer', provider: { name: 'openai', model: 'gpt' } });
			expect(
				answer.calledOnceWith({
					query: 'what happened?',
					messages: [{ text: 'text of message-1', username: 'author', roomName: 'General', ts: '2026-01-02T03:04:05.000Z', score: 0.5 }],
				}),
			).to.be.true;
		});

		it('should use the room name when the room has no display name', async () => {
			visibleMessages = [messageIn('sales', 'message-1')];
			subscriptions = [subscriptionTo('sales')];

			await requestAnswer([{ _id: 'message-1' }]);

			expect(answer.firstCall.args[0].messages[0].roomName).to.equal('sales');
		});

		it('should send the message as normalized for the user', async () => {
			normalizeMessages.callsFake(async (docs: Record<string, unknown>[]) => docs.map((doc) => ({ ...doc, msg: 'normalized text' })));

			await requestAnswer([{ _id: 'message-1' }]);

			expect(normalizeMessages.firstCall.args[1]).to.equal(userId);
			expect(answer.firstCall.args[0].messages[0].text).to.equal('normalized text');
		});

		it('should keep the order the sources were sent in', async () => {
			visibleMessages = [messageIn('general', 'message-1'), messageIn('general', 'message-2')];

			await requestAnswer([{ _id: 'message-2' }, { _id: 'message-1' }]);

			expect(answer.firstCall.args[0].messages.map(({ text }: { text: string }) => text)).to.deep.equal([
				'text of message-2',
				'text of message-1',
			]);
		});

		it('should refuse a source in a room the user is not subscribed to', async () => {
			subscriptions = [{ rid: 'general', u: { _id: 'someone-else' } }];

			await expectRefused(requestAnswer([{ _id: 'message-1' }]), 'error-invalid-search-answer-sources');

			expect(answer.called).to.be.false;
		});

		it('should refuse the whole request when one of the sources is in a room the user is not subscribed to', async () => {
			visibleMessages = [messageIn('general', 'message-1'), messageIn('sales', 'secret')];

			await expectRefused(requestAnswer([{ _id: 'message-1' }, { _id: 'secret' }]), 'error-invalid-search-answer-sources');

			expect(answer.called).to.be.false;
		});

		it('should refuse a source in a room the user is banned from', async () => {
			subscriptions = [subscriptionTo('general', 'BANNED')];

			await expectRefused(requestAnswer([{ _id: 'message-1' }]), 'error-invalid-search-answer-sources');

			expect(answer.called).to.be.false;
		});

		it('should accept a source in a room the user is invited to', async () => {
			subscriptions = [subscriptionTo('general', 'INVITED')];

			await requestAnswer([{ _id: 'message-1' }]);

			expect(answer.calledOnce).to.be.true;
		});

		it('should refuse a source that is hidden or was deleted', async () => {
			await expectRefused(requestAnswer([{ _id: 'message-1' }, { _id: 'deleted' }]), 'error-invalid-search-answer-sources');

			expect(answer.called).to.be.false;
		});

		it('should refuse before reading any message when no source has an id', async () => {
			await expectRefused(requestAnswer([{ _id: '' }]), 'error-invalid-search-answer-sources');

			expect(findVisibleByIds.called).to.be.false;
		});

		it('should ignore a source with no id next to a valid one', async () => {
			await requestAnswer([{ _id: '' }, { _id: 'message-1' }]);

			expect(answer.firstCall.args[0].messages).to.have.lengthOf(1);
		});

		it('should use a source sent twice once, with its last score', async () => {
			await requestAnswer([
				{ _id: 'message-1', score: 0.2 },
				{ _id: 'message-1', score: 0.7 },
			]);

			const { messages } = answer.firstCall.args[0];
			expect(messages).to.have.lengthOf(1);
			expect(messages[0].score).to.equal(0.7);
		});

		for (const { score, expected } of [
			{ score: 5, expected: 1 },
			{ score: -2, expected: 0 },
		]) {
			it(`should keep a score of ${score} between 0 and 1`, async () => {
				await requestAnswer([{ _id: 'message-1', score }]);

				expect(answer.firstCall.args[0].messages[0].score).to.equal(expected);
			});
		}

		it('should drop a score that is not a finite number', async () => {
			await requestAnswer([{ _id: 'message-1', score: Number.POSITIVE_INFINITY }]);

			expect(answer.firstCall.args[0].messages[0]).to.not.have.property('score');
		});

		it('should leave out a source with no text', async () => {
			visibleMessages = [messageIn('general', 'message-1'), { ...messageIn('general', 'attachment-only'), msg: '' }];

			await requestAnswer([{ _id: 'message-1' }, { _id: 'attachment-only' }]);

			expect(answer.firstCall.args[0].messages).to.have.lengthOf(1);
		});

		it('should refuse when no source has text', async () => {
			visibleMessages = [{ ...messageIn('general', 'message-1'), msg: '' }];

			await expectRefused(requestAnswer([{ _id: 'message-1' }]), 'error-invalid-search-answer-sources');

			expect(answer.called).to.be.false;
		});

		for (const code of ['error-ai-not-enabled', 'error-ai-provider-not-configured', 'error-ai-provider-empty-response']) {
			it(`should tell the client about ${code}`, async () => {
				answer.rejects(new Error(code));

				await expectRefused(requestAnswer([{ _id: 'message-1' }]), code);
			});
		}

		it('should not show the client any other provider error', async () => {
			answer.rejects(new Error('connect ECONNREFUSED 10.0.0.5:443'));

			await expectRefused(requestAnswer([{ _id: 'message-1' }]), 'error-ai-provider-request-failed');
		});
	});

	describe('ai.search', () => {
		for (const gate of ['hasIntelligentSearchLicense', 'intelligentSearchEnabled', 'intelligentSearchConfigured']) {
			it(`should return no results and not search when ${gate} is false`, async () => {
				status.resolves({
					hasIntelligentSearchLicense: true,
					intelligentSearchEnabled: true,
					intelligentSearchConfigured: true,
					answerGenerationConfigured: true,
					[gate]: false,
				});

				const { body } = await requestSearch();

				expect(body.intelligent).to.deep.equal([]);
				expect(search.called).to.be.false;
			});
		}

		it('should report the feature as off when its status is unavailable', async () => {
			status.rejects(new Error('service is down'));

			const { body } = await requestSearch();

			expect(body).to.deep.equal({
				intelligent: [],
				meta: { intelligentSearchEnabled: false, intelligentSearchConfigured: false, answerGenerationConfigured: false },
			});
			expect(search.called).to.be.false;
		});

		it('should return the results with the status of the feature', async () => {
			const results = [{ _id: 'message-1', text: 'budget' }];
			search.resolves(results);

			const { body } = await requestSearch();

			expect(body).to.deep.equal({
				intelligent: results,
				meta: { intelligentSearchEnabled: true, intelligentSearchConfigured: true, answerGenerationConfigured: true },
			});
		});

		it('should search as the user, with the query trimmed and no filters by default', async () => {
			await requestSearch({ query: '  budget  ' });

			expect(
				search.calledOnceWith({
					query: 'budget',
					userId,
					filters: {
						rid: undefined,
						rids: [],
						roomNames: [],
						fromUsername: undefined,
						fromUsernames: [],
						startDate: undefined,
						endDate: undefined,
					},
					searchType: undefined,
					limit: AI_SEARCH_PAGE_SIZE,
				}),
			).to.be.true;
		});

		it('should pass the filters on, cleaned up', async () => {
			await requestSearch({
				rid: 'general',
				rids: ' general, ,sales ',
				roomNames: 'general,sales',
				fromUsername: 'alice',
				fromUsernames: 'alice, bob',
				startDate: '2026-01-02T03:04:05Z',
				endDate: '2026-02-03T04:05:06Z',
			});

			expect(search.firstCall.args[0].filters).to.deep.equal({
				rid: 'general',
				rids: ['general', 'sales'],
				roomNames: ['general', 'sales'],
				fromUsername: 'alice',
				fromUsernames: ['alice', 'bob'],
				startDate: '2026-01-02T03:04:05.000Z',
				endDate: '2026-02-03T04:05:06.000Z',
			});
		});

		for (const searchType of ['semantic', 'keyword', 'hybrid']) {
			it(`should search with the ${searchType} type the client asks for`, async () => {
				await requestSearch({ searchType });

				expect(search.firstCall.args[0].searchType).to.equal(searchType);
			});
		}

		it('should limit how many values a filter takes', async () => {
			const values = Array.from({ length: MAX_SEARCH_FILTER_VALUES + 5 }, (_, index) => `room-${index}`);

			await requestSearch({ rids: values.join(',') });

			expect(search.firstCall.args[0].filters.rids).to.deep.equal(values.slice(0, MAX_SEARCH_FILTER_VALUES));
		});

		for (const { count, limit } of [
			{ count: 0, limit: 1 },
			{ count: 7.9, limit: 7 },
			{ count: MAX_INTELLIGENT_SEARCH_RESULTS + 1, limit: MAX_INTELLIGENT_SEARCH_RESULTS },
		]) {
			it(`should search for ${limit} results when the client asks for ${count}`, async () => {
				await requestSearch({ intelligentCount: count });

				expect(search.firstCall.args[0].limit).to.equal(limit);
			});
		}

		it('should tell the client about a known search failure', async () => {
			search.rejects(new Error('error-ai-search-timeout'));

			await expectRefused(requestSearch(), 'error-ai-search-timeout');
		});

		it('should not show the client any other search failure', async () => {
			search.rejects(new Error('connect ECONNREFUSED 10.0.0.5:443'));

			await expectRefused(requestSearch(), 'error-ai-search-request-failed');
		});
	});

	describe('ai.llm.models', () => {
		it('should list the models for a user who can reach all settings', async () => {
			hasAtLeastOnePermission.withArgs(userId, ['view-privileged-setting', 'edit-privileged-setting']).resolves(true);
			models.resolves([{ key: 'gpt', label: 'GPT' }]);

			const { body } = await requestModels();

			expect(body).to.deep.equal({ data: [{ key: 'gpt', label: 'GPT' }] });
		});

		it('should list the models for a user who can manage this one setting', async () => {
			hasAllPermission.withArgs(userId, ['manage-selected-settings', 'change-setting-AI_LLM_OpenAI_Model']).resolves(true);
			models.resolves([]);

			const { body } = await requestModels();

			expect(body).to.deep.equal({ data: [] });
		});

		it('should refuse any other user', async () => {
			const { statusCode } = await requestModels();

			expect(statusCode).to.equal(403);
			expect(models.called).to.be.false;
		});
	});
});
