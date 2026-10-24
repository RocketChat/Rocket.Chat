import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Settings: {
		incrementValueById: sinon.stub(),
	},
};

const settingsMock = {
	settings: {
		get: sinon.stub(),
	},
};

const hasPermissionAsyncMock = sinon.stub();

const mailerMock = {
	getTemplate: sinon.stub(),
	checkAddressFormat: sinon.stub(),
	send: sinon.stub(),
};

const notifyOnSettingChangedMock = sinon.stub();

const meteorErrorMock = class extends Error {
	error: string;

	details: unknown;

	constructor(error: string, message: string, details?: unknown) {
		super(message);
		this.error = error;
		this.details = details;
	}
};

const { sendInvitationEmail } = p.noCallThru().load('../../../../../../server/lib/rooms/invites/sendInvitationEmail.ts', {
	'@rocket.chat/models': modelsMock,
	'meteor/check': { check: () => undefined },
	'meteor/meteor': { Meteor: { startup: sinon.stub(), Error: meteorErrorMock } },
	'../../../settings': settingsMock,
	'../../authorization/hasPermission': { hasPermissionAsync: hasPermissionAsyncMock },
	'../../notifications/email/api': mailerMock,
	'../../notifyListener': { notifyOnSettingChanged: notifyOnSettingChangedMock },
});

describe('sendInvitationEmail', () => {
	beforeEach(() => {
		modelsMock.Settings.incrementValueById.reset();
		settingsMock.settings.get.reset();
		hasPermissionAsyncMock.reset();
		mailerMock.checkAddressFormat.reset();
		mailerMock.send.reset();
		notifyOnSettingChangedMock.reset();

		hasPermissionAsyncMock.resolves(true);
		mailerMock.checkAddressFormat.returns(true);
		mailerMock.send.resolves();
		settingsMock.settings.get.callsFake((key: string) => {
			if (key === 'Invitation_Subject') return 'You are invited';
			if (key === 'From_Email') return 'no-reply@example.com';
			return '';
		});
		modelsMock.Settings.incrementValueById.resolves({ _id: 'Invitation_Email_Count', value: 1 });
	});

	it('returns true after successfully sending every invitation email', async () => {
		const result = await sendInvitationEmail('user1', ['colleague@example.com']);

		expect(result).to.equal(true);
		sinon.assert.calledOnce(mailerMock.send);
		sinon.assert.calledOnce(modelsMock.Settings.incrementValueById);
	});

	it('notifies the setting change when the counter is incremented', async () => {
		await sendInvitationEmail('user1', ['colleague@example.com']);

		sinon.assert.calledOnce(notifyOnSettingChangedMock);
	});

	it('throws when the caller has no user id', async () => {
		await expect(sendInvitationEmail('', ['colleague@example.com'])).to.be.rejectedWith('Invalid user');
	});

	it('throws when the user lacks the bulk-register-user permission', async () => {
		hasPermissionAsyncMock.resolves(false);

		await expect(sendInvitationEmail('user1', ['colleague@example.com'])).to.be.rejectedWith('Not allowed');
	});

	it('throws when no email addresses are valid', async () => {
		mailerMock.checkAddressFormat.returns(false);

		await expect(sendInvitationEmail('user1', ['not-an-email'])).to.be.rejectedWith('No valid email addresses');
	});

	it('throws when Mailer.send fails and does not report success', async () => {
		mailerMock.send.rejects(new Error('SMTP unavailable'));

		await expect(sendInvitationEmail('user1', ['colleague@example.com'])).to.be.rejectedWith(
			'Error trying to send email: SMTP unavailable',
		);
	});
});
