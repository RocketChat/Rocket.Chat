import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

// Create stubs for dependencies
const stubs = {
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
};

let saveUserIdentity: any;

before(async () => {
	const moduleMocks = [
		mock.module('../../database/utils', { exports: { onceTransactionCommitedSuccessfully: async (cb: any, _sess: any) => cb() } }),
		mock.module('../media/file-upload', {
			exports: {
				FileUpload: stubs.FileUpload,
			},
		}),
		mock.module('./setUsername', {
			exports: {
				_setUsername: stubs.setUsername,
				_setUsernameWithSession: () => stubs.setUsername,
			},
		}),
		mock.module('./setRealName', {
			exports: {
				setRealName: stubs.setRealName,
			},
		}),
		mock.module('../rooms/updateGroupDMsName', {
			exports: {
				updateGroupDMsName: sinon.stub(),
			},
		}),
		mock.module('../shared/validateName', {
			exports: {
				validateName: stubs.validateName,
			},
		}),
	];
	({ saveUserIdentity } = await import('./saveUserIdentity'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('Users - saveUserIdentity', () => {
	before(() => {
		mockModel('Users', { findOneById: stubs.findOneUserById });
		mockModel('Messages', {
			updateUsernameAndMessageOfMentionByIdAndOldUsername: stubs.updateUsernameAndMessageOfMentionByIdAndOldUsername,
			updateUsernameOfEditByUserId: stubs.updateUsernameOfEditByUserId,
			updateAllUsernamesByUserId: stubs.updateAllUsernamesByUserId,
		});
		mockModel('Subscriptions', {
			updateDirectNameAndFnameByName: stubs.updateDirectNameAndFnameByName,
		});
		mockModel('VideoConference', { updateUserReferences: stubs.updateUserReferences });
		mockModel('CallHistory', { updateUserReferences: stubs.updateHistoryReferences });
	});

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
