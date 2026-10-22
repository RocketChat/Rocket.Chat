import { before, beforeEach, describe, it } from 'node:test';

import type { IScheduledMessage } from '@rocket.chat/core-typings';
import type { IScheduledMessagesModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import sinon from 'sinon';

import { processDueScheduledMessages, STALE_SENDING_MS } from './processDueScheduledMessages';

const now = new Date('2026-10-14T12:00:00.000Z');
const item = (_id: string): IScheduledMessage =>
	({ _id, rid: 'r1', u: { _id: 'u1', username: 'alice' }, msg: _id, status: 'sending' }) as IScheduledMessage;

const model = {
	findStaleSending: sinon.stub(),
	claimNextDue: sinon.stub(),
	removeById: sinon.stub(),
	setFailedById: sinon.stub(),
};

const claims = (...ids: string[]) => {
	ids.forEach((id, i) => model.claimNextDue.onCall(i).resolves(item(id)));
	model.claimNextDue.onCall(ids.length).resolves(null);
};

describe('processDueScheduledMessages', () => {
	const deliver = sinon.stub();
	const notify = sinon.stub();

	before(() => {
		registerModel('IScheduledMessagesModel', model as unknown as IScheduledMessagesModel);
	});

	beforeEach(() => {
		[...Object.values(model), deliver, notify].forEach((stub) => stub.reset());
		model.findStaleSending.returns([]);
	});

	it('sends each due item once and removes it', async () => {
		claims('a', 'b');
		deliver.resolves({ _id: 'm' });

		await processDueScheduledMessages(deliver, notify, now);

		expect(deliver.args.map(([sent]) => sent._id)).to.deep.equal(['a', 'b']);
		expect(model.removeById.args).to.deep.equal([['a'], ['b']]);
	});

	it('keeps a refused item as failed with its reason, and still sends the next one', async () => {
		claims('a', 'b');
		deliver.onFirstCall().rejects(Object.assign(new Error('muted'), { error: 'You_have_been_muted' }));
		deliver.onSecondCall().resolves({ _id: 'm' });

		await processDueScheduledMessages(deliver, notify, now);

		expect(model.setFailedById.args).to.deep.equal([['a', 'You_have_been_muted']]);
		expect(model.removeById.args).to.deep.equal([['b']]);
	});

	it('fails an item stuck in sending after a crash, and tells its author', async () => {
		claims();
		model.findStaleSending.returns([item('stale')]);

		await processDueScheduledMessages(deliver, notify, now);

		expect(model.findStaleSending.args).to.deep.equal([[new Date(now.getTime() - STALE_SENDING_MS)]]);
		expect(model.setFailedById.args).to.deep.equal([['stale', 'error-scheduled-message-interrupted']]);
		expect(notify.args).to.deep.equal([['u1']]);
	});
});
