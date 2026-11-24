import { after, before, beforeEach, describe, it } from 'node:test';

import { api } from '@rocket.chat/core-services';
import type { IIntegration, IIntegrationHistory } from '@rocket.chat/core-typings';
import type { IIntegrationHistoryModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import sinon from 'sinon';

import { updateHistory } from './updateHistory';

const sandbox = sinon.createSandbox();

const stored = new Map<string, Partial<IIntegrationHistory>>();

const IntegrationHistory = {
	create: async (history: IIntegrationHistory) => {
		stored.set('history-id', { ...history, _id: 'history-id' });
		return { insertedId: 'history-id' };
	},
	updateById: async (_id: string, fields: Partial<IIntegrationHistory>) => {
		const history = stored.get(_id);
		if (!history) {
			return null;
		}
		stored.set(_id, { ...history, ...fields });
		return { _id, integration: history.integration };
	},
	findOneById: async (_id: string) => stored.get(_id) ?? null,
};

const integration = { _id: 'integration-id' } as IIntegration;

describe('updateHistory', () => {
	let broadcast: sinon.SinonStub;

	before(() => {
		registerModel('IIntegrationHistoryModel', IntegrationHistory as unknown as IIntegrationHistoryModel);
		broadcast = sandbox.stub(api, 'broadcast').resolves();
	});

	after(() => {
		sandbox.restore();
	});

	beforeEach(() => {
		stored.clear();
		broadcast.resetHistory();
	});

	it('should store a new history for the integration and notify that it was inserted', async () => {
		const historyId = await updateHistory({ historyId: '', step: 'start-execute-trigger-integration', integration, event: 'sendMessage' });

		expect(historyId).to.equal('history-id');
		expect(stored.get(historyId)).to.include({ type: 'outgoing-webhook', step: 'start-execute-trigger-integration', event: 'sendMessage' });
		expect(broadcast.calledOnceWith('watch.integrationHistory', sinon.match({ clientAction: 'inserted', id: historyId }))).to.be.true;
	});

	it('should store a later step on the same history and notify that it was updated', async () => {
		const historyId = await updateHistory({ historyId: '', step: 'start-execute-trigger-integration', integration });
		broadcast.resetHistory();

		await updateHistory({ historyId, step: 'after-process-http-status-500', error: true });

		expect(stored.get(historyId)).to.include({ step: 'after-process-http-status-500', error: true });
		expect(broadcast.calledOnceWith('watch.integrationHistory', sinon.match({ clientAction: 'updated', id: historyId }))).to.be.true;
	});

	it('should store the trigger word, the prepare script run and the HTTP result that a step records', async () => {
		const historyId = await updateHistory({ historyId: '', step: 'start-execute-trigger-integration', integration });

		await updateHistory({ historyId, step: 'after-maybe-ran-prepare', triggerWord: 'deploy', ranPrepareScript: true });
		await updateHistory({ historyId, step: 'after-http-call', httpResult: '{"ok":true}' });

		expect(stored.get(historyId)).to.include({ triggerWord: 'deploy', ranPrepareScript: true, httpResult: '"{\\"ok\\":true}"' });
	});

	it('should store the user that triggered the integration without its services', async () => {
		const historyId = await updateHistory({ historyId: '', step: 'start-execute-trigger-integration', integration });

		await updateHistory({
			historyId,
			step: 'mapped-args-to-data',
			data: {
				message_id: 'message-id',
				user: { _id: 'user-id', username: 'alice', services: { password: { bcrypt: 'hash' } } },
				room: { _id: 'room-id', name: 'general' },
			},
		});

		expect(stored.get(historyId)?.data).to.deep.equal({
			message_id: 'message-id',
			user: { _id: 'user-id', username: 'alice' },
			room: { _id: 'room-id', name: 'general' },
		});
	});

	it('should replace the data sent to the trigger with an empty object when a later step records no data', async () => {
		const historyId = await updateHistory({ historyId: '', step: 'start-execute-trigger-integration', integration });
		await updateHistory({ historyId, step: 'mapped-args-to-data', data: { message_id: 'message-id' } });

		await updateHistory({ historyId, step: 'after-maybe-ran-prepare', ranPrepareScript: true });

		expect(stored.get(historyId)?.data).to.deep.equal({});
	});
});
