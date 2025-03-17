import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

// Create stubs for dependencies
const stubs = {
	findOneUserById: sinon.stub(),
	updateUsernameAndMessageOfMentionByIdAndOldUsername: sinon.stub(),
	updateUsernameOfEditByUserId: sinon.stub(),
	updateAllUsernamesByUserId: sinon.stub(),
	updateDirectNameAndFnameByName: sinon.stub(),
	updateUserReferences: sinon.stub(),
	setUsername: sinon.stub(),
	setRealName: sinon.stub(),
	validateName: sinon.stub(),
	FileUpload: sinon.stub(),
};

const { saveUserIdentity } = proxyquire.noCallThru().load('../../../../app/lib/server/functions/saveUserIdentity', {
	'@rocket.chat/models': {
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
	},
	'meteor/meteor': {
		'Meteor': sinon.stub(),
		'@global': true,
	},
	'../../../../server/database/utils': { onceTransactionCommitedSuccessfully: async (cb: any, _sess: any) => cb() },
	'../../../../app/file-upload/server': {
		FileUpload: stubs.FileUpload,
	},
	'../../../../app/lib/server/functions/setRealName': {
		_setRealName: stubs.setRealName,
	},
	'../../../../app/lib/server/functions/setUsername': {
		_setUsername: stubs.setUsername,
		_setUsernameWithSession: () => stubs.setUsername,
	},
	'../../../../app/lib/server/functions/updateGroupDMsName': {
		updateGroupDMsName: sinon.stub(),
	},
	'../../../../app/lib/server/functions/validateName': {
		validateName: stubs.validateName,
	},
});

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
	});

	it('should return false if _setName fails', async () => {
		stubs.findOneUserById.returns({ name: 'oldName' });
		stubs.setRealName.returns(false);
		const result = await saveUserIdentity({ _id: 'valid_id', name: 'invalidName' });

		expect(stubs.setRealName.calledWith('valid_id', 'invalidName', { name: 'oldName' })).to.be.true;
		expect(result).to.be.false;
	});

	it('should update Subscriptions and VideoConference if name changes', async () => {
		stubs.findOneUserById.returns({ name: 'oldName', username: 'oldUsername' });
		stubs.setRealName.returns(true);
		const result = await saveUserIdentity({ _id: 'valid_id', name: 'name', username: 'oldUsername' });

		expect(stubs.setUsername.called).to.be.false;
		expect(stubs.setRealName.called).to.be.true;
		expect(stubs.updateUsernameOfEditByUserId.called).to.be.false;
		expect(stubs.updateDirectNameAndFnameByName.called).to.be.true;
		expect(stubs.updateUserReferences.called).to.be.true;
		expect(result).to.be.true;
	});
});
