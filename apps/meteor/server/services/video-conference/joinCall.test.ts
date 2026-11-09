import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

import { createService } from './testHarness';

const runAsync = sinon.stub();

const VideoConfService = createService({
	overrides: {
		'../../lib/callbacks': { callbacks: { runAsync, run: () => undefined } },
	},
});

const call = { _id: 'call1', rid: 'room1', providerName: 'test', createdBy: { _id: 'creator' } };
const user = { _id: 'user1', username: 'user.one', name: 'User One', avatarETag: null };

describe('VideoConfService.joinCall', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		runAsync.reset();
		service.runOnUserJoinEvent = sinon.stub().resolves();
		service.runsInOurCallWindow = () => false;
		service.isEmbeddedProvider = () => true;
	});

	// The window refetches the call as soon as the join answers; answering first is what left the arriving user
	// listed as not in the call, when the broadcast that would have corrected it beat the window's subscription.
	it('should answer only once the arrival has been recorded', async () => {
		let recorded = false;
		runAsync.callsFake(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			recorded = true;
		});

		await service.joinCall(call, user, {});

		expect(runAsync.calledWith('onJoinVideoConference', 'call1', 'user1')).to.be.true;
		expect(recorded).to.be.true;
	});

	// Failing to write the roster is not a reason to keep somebody out of the call.
	it('should still let them in when recording the arrival fails', async () => {
		runAsync.rejects(new Error('database unavailable'));

		expect(await service.joinCall(call, user, {})).to.equal('');
	});
});
