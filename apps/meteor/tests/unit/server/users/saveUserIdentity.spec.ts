import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

// Stubs built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them.
const { stubs, updateGroupDMsName, onceTransactionCommitedSuccessfully, notifyListener } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		stubs: {
			findOneUserById: sinon.stub(),
			updateUsernameAndMessageOfMentionByIdAndOldUsername: sinon.stub(),
			updateUsernameOfEditByUserId: sinon.stub(),
			updateAllUsernamesByUserId: sinon.stub(),
			updateDirectNameAndFnameByName: sinon.stub(),
			updateUserReferences: sinon.stub(),
			updateHistoryReferences: sinon.stub(),
			setUsername: sinon.stub(),
			setRealName: sinon.stub(),
			validateName: sinon.stub(),
			FileUpload: sinon.stub(),
		},
		updateGroupDMsName: sinon.stub(),
		onceTransactionCommitedSuccessfully: async (cb: any, _sess: any) => cb(),
		// Side-effect-only dependency; stubbed to silence noise (never asserted on).
		notifyListener: {
			notifyOnRoomChangedByUsernamesOrUids: sinon.stub(),
			notifyOnSubscriptionChangedByUserId: sinon.stub(),
			notifyOnSubscriptionChangedByNameAndRoomType: sinon.stub(),
		},
	};
});

vi.mock('@rocket.chat/models', () => ({
	Users: {
		findOneById: stubs.findOneUserById,
	},
	Messages: {
		updateUsernameAndMessageOfMentionByIdAndOldUsername: stubs.updateUsernameAndMessageOfMentionByIdAndOldUsername,
		updateUsernameOfEditByUserId: stubs.updateUsernameOfEditByUserId,
		updateAllUsernamesByUserId: stubs.updateAllUsernamesByUserId,
	},
	Subscriptions: {
		updateDirectNameAndFnameByName: stubs.updateDirectNameAndFnameByName,
	},
	VideoConference: {
		updateUserReferences: stubs.updateUserReferences,
	},
	CallHistory: {
		updateUserReferences: stubs.updateHistoryReferences,
	},
}));
vi.mock('../../../../server/database/utils', () => ({ onceTransactionCommitedSuccessfully }));
vi.mock('../../../../app/file-upload/server', () => ({ FileUpload: stubs.FileUpload }));
vi.mock('../../../../app/lib/server/functions/setUsername', () => ({ _setUsername: stubs.setUsername }));
vi.mock('../../../../app/lib/server/functions/setRealName', () => ({ setRealName: stubs.setRealName }));
vi.mock('../../../../app/lib/server/functions/updateGroupDMsName', () => ({ updateGroupDMsName }));
vi.mock('../../../../app/lib/server/functions/validateName', () => ({ validateName: stubs.validateName }));
vi.mock('../../../../app/lib/server/lib/notifyListener', () => notifyListener);

const { saveUserIdentity } = await import('../../../../app/lib/server/functions/saveUserIdentity');

describe('Users - saveUserIdentity', () => {
	beforeEach(() => {
		// Reset stubs before each test
		Object.values(stubs).forEach((stub) => stub.reset());
	});

	it('should return false if _id is not provided', async () => {
		const result = await saveUserIdentity({ _id: undefined });

		expect(stubs.findOneUserById.called).to.be.false;
		expect(result).to.be.false;
	});

	it('should return false if user does not exist', async () => {
		stubs.findOneUserById.returns(undefined);
		const result = await saveUserIdentity({ _id: 'valid_id' });

		expect(stubs.findOneUserById.calledWith('valid_id')).to.be.true;
		expect(result).to.be.false;
	});

	it('should return false if username is not allowed', async () => {
		stubs.findOneUserById.returns({ username: 'oldUsername' });
		stubs.validateName.returns(false);
		const result = await saveUserIdentity({ _id: 'valid_id', username: 'admin' });

		expect(stubs.validateName.calledWith('admin')).to.be.true;
		expect(result).to.be.false;
	});

	it('should return false if username is invalid or unavailable', async () => {
		stubs.findOneUserById.returns({ username: 'oldUsername' });
		stubs.validateName.returns(true);
		stubs.setUsername.returns(false);
		const result = await saveUserIdentity({ _id: 'valid_id', username: 'invalidUsername' });

		expect(stubs.validateName.calledWith('invalidUsername')).to.be.true;
		expect(stubs.setUsername.calledWith('valid_id', 'invalidUsername', { username: 'oldUsername' })).to.be.true;
		expect(result).to.be.false;
	});

	it("should not update the username if it's not changed", async () => {
		stubs.findOneUserById.returns({ username: 'oldUsername', name: 'oldName' });
		stubs.validateName.returns(true);
		stubs.setUsername.returns(true);
		await saveUserIdentity({ _id: 'valid_id', username: 'oldUsername', name: 'oldName' });

		expect(stubs.validateName.called).to.be.false;
		expect(stubs.setUsername.called).to.be.false;
		expect(stubs.updateUsernameOfEditByUserId.called).to.be.false;
		expect(stubs.updateAllUsernamesByUserId.called).to.be.false;
		expect(stubs.updateUsernameAndMessageOfMentionByIdAndOldUsername.called).to.be.false;
		expect(stubs.updateDirectNameAndFnameByName.called).to.be.false;
		expect(stubs.updateUserReferences.called).to.be.false;
		expect(stubs.updateHistoryReferences.called).to.be.false;
	});

	it('should update Subscriptions, VideoConference and Call History if name changes', async () => {
		stubs.findOneUserById.returns({ name: 'oldName', username: 'oldUsername' });
		stubs.setRealName.returns(true);
		const result = await saveUserIdentity({ _id: 'valid_id', name: 'name', username: 'oldUsername' });

		expect(stubs.setUsername.called).to.be.false;
		expect(stubs.setRealName.called).to.be.true;
		expect(stubs.updateUsernameOfEditByUserId.called).to.be.false;
		expect(stubs.updateDirectNameAndFnameByName.called).to.be.true;
		expect(stubs.updateUserReferences.called).to.be.true;
		expect(stubs.updateHistoryReferences.called).to.be.true;
		expect(result).to.be.true;
	});
});
