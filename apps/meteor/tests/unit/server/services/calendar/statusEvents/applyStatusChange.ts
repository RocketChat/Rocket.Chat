import { Presence } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';

describe('Calendar.applyStatusChange', () => {
	let sandbox: sinon.SinonSandbox;
	let setActiveStateStub: sinon.SinonStub;

	const fakeEventId = 'eventId123';
	const fakeUserId = 'userId456';
	const fakeEndTime = new Date('2025-01-01T11:00:00Z');

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		setActiveStateStub = sandbox.stub(Presence, 'setActiveState').resolves();
	});

	afterEach(() => {
		sandbox.restore();
	});

	// applyStatusChange is tightly coupled to the module loader (proxyquire was used before).
	// Since it now delegates entirely to Presence.setActiveState, we test via the Presence stub.
	// The function is simple enough that integration coverage via calendar E2E tests is sufficient.
	// These tests validate the contract: applyStatusChange calls Presence.setActiveState with the right args.

	it('should call Presence.setActiveState with external source and calendar emoji', async () => {
		const { applyStatusChange } = await import('../../../../../../server/services/calendar/statusEvents/applyStatusChange');

		await applyStatusChange({
			eventId: fakeEventId,
			uid: fakeUserId,
			subject: 'Daily standup',
			endTime: fakeEndTime,
		});

		expect(setActiveStateStub.callCount).to.equal(1);
		const [uid, state] = setActiveStateStub.firstCall.args;
		expect(uid).to.equal(fakeUserId);
		expect(state.statusDefault).to.equal(UserStatus.BUSY);
		expect(state.statusText).to.equal('Daily standup');
		expect(state.statusSource).to.equal('external');
		expect(state.statusEmoji).to.equal('\u{1F4C5}');
		expect(state.statusExpiresAt).to.deep.equal(fakeEndTime);
	});

	it('when subject is not provided, statusText should default to empty string', async () => {
		const { applyStatusChange } = await import('../../../../../../server/services/calendar/statusEvents/applyStatusChange');

		await applyStatusChange({
			eventId: fakeEventId,
			uid: fakeUserId,
			endTime: fakeEndTime,
		});

		expect(setActiveStateStub.callCount).to.equal(1);
		const [, state] = setActiveStateStub.firstCall.args;
		expect(state.statusText).to.equal('');
	});

	it('when endTime is not provided, should not include statusExpiresAt', async () => {
		const { applyStatusChange } = await import('../../../../../../server/services/calendar/statusEvents/applyStatusChange');

		await applyStatusChange({
			eventId: fakeEventId,
			uid: fakeUserId,
		});

		expect(setActiveStateStub.callCount).to.equal(1);
		const [, state] = setActiveStateStub.firstCall.args;
		expect(state.statusExpiresAt).to.be.undefined;
	});
});
