import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const getRoleIds = sinon.stub();
const hasPermissionAsync = sinon.stub();
const isAdminHidingAllowed = sinon.stub();
const checkEmailAvailability = sinon.stub();
const checkUsernameAvailability = sinon.stub();

const { validateUserData } = proxyquire.noCallThru().load('./validateUserData', {
	'./saveUser': { isUpdateUserData: (params: { _id?: string }) => '_id' in params && !!params._id },
	'../../../settings': { settings: { get: settingsGet } },
	'../../authorization/getRoles': { getRoleIds },
	'../../authorization/hasPermission': { hasPermissionAsync },
	'../../statusVisibility/settings': { isAdminHidingAllowed },
	'../checkEmailAvailability': { checkEmailAvailability },
	'../checkUsernameAvailability': { checkUsernameAvailability },
});

describe('validateUserData', () => {
	let granted: Set<string>;

	const newUser = { username: 'jane', name: 'Jane', password: 'secret', email: 'jane@example.com' };

	beforeEach(() => {
		[settingsGet, getRoleIds, hasPermissionAsync, isAdminHidingAllowed, checkEmailAvailability, checkUsernameAvailability].forEach((stub) =>
			stub.reset(),
		);
		granted = new Set(['create-user', 'edit-other-user-info', 'assign-admin-role']);
		hasPermissionAsync.callsFake(async (_uid: string, permission: string) => granted.has(permission));
		getRoleIds.resolves(['user', 'admin', 'bot']);
		settingsGet.withArgs('UTF8_User_Names_Validation').returns('[0-9a-zA-Z-_.]+');
		isAdminHidingAllowed.returns(true);
		checkUsernameAvailability.resolves(true);
		checkEmailAvailability.resolves(true);
	});

	it('accepts a valid new user after checking username and email availability', async () => {
		await validateUserData('admin', newUser);

		expect(hasPermissionAsync.calledWith('admin', 'create-user')).to.be.true;
		expect(checkUsernameAvailability.calledOnceWith('jane')).to.be.true;
		expect(checkEmailAvailability.calledOnceWith('jane@example.com')).to.be.true;
		sinon.assert.callOrder(checkUsernameAvailability, checkEmailAvailability);
	});

	it('refuses a user editing its own email verification', async () => {
		await expect(validateUserData('uid', { _id: 'uid', verified: true })).to.be.rejectedWith(
			'Editing email verification is not allowed [error-action-not-allowed]',
		);
	});

	it('lets a user edit itself without edit-other-user-info', async () => {
		granted.clear();

		await validateUserData('uid', { _id: 'uid', verified: false });

		expect(hasPermissionAsync.called).to.be.false;
	});

	it('refuses editing another user without edit-other-user-info', async () => {
		granted.delete('edit-other-user-info');

		await expect(validateUserData('admin', { _id: 'uid' })).to.be.rejectedWith('Editing user is not allowed [error-action-not-allowed]');
	});

	it('refuses creating a user without create-user', async () => {
		granted.delete('create-user');

		await expect(validateUserData('admin', newUser)).to.be.rejectedWith('Adding user is not allowed [error-action-not-allowed]');
	});

	describe('presenceDisabledByAdmin on a new user', () => {
		it('is accepted with edit-other-user-info when admin hiding is allowed', async () => {
			await validateUserData('admin', { ...newUser, presenceDisabledByAdmin: false });
		});

		it('is refused without edit-other-user-info', async () => {
			granted.delete('edit-other-user-info');

			await expect(validateUserData('admin', { ...newUser, presenceDisabledByAdmin: true })).to.be.rejectedWith(
				'Edit user presence is not allowed [error-action-not-allowed]',
			);
		});

		it('is refused when admin hiding is not allowed', async () => {
			isAdminHidingAllowed.returns(false);

			await expect(validateUserData('admin', { ...newUser, presenceDisabledByAdmin: true })).to.be.rejectedWith(
				'Edit user presence is not allowed [error-action-not-allowed]',
			);
		});

		it('is not checked on an update', async () => {
			isAdminHidingAllowed.returns(false);

			await validateUserData('admin', { _id: 'uid', presenceDisabledByAdmin: true });

			expect(isAdminHidingAllowed.called).to.be.false;
		});
	});

	it('refuses unknown role ids', async () => {
		await expect(validateUserData('admin', { ...newUser, roles: ['user', 'ghost'] })).to.be.rejectedWith(
			'The field Roles consist invalid role id [error-action-not-allowed]',
		);
	});

	it('refuses assigning admin without assign-admin-role', async () => {
		granted.delete('assign-admin-role');

		await expect(validateUserData('admin', { _id: 'uid', roles: ['admin'] })).to.be.rejectedWith(
			'Assigning admin is not allowed [error-action-not-allowed]',
		);
	});

	it('accepts known roles including admin with assign-admin-role', async () => {
		await validateUserData('admin', { _id: 'uid', roles: ['admin', 'bot'] });

		expect(hasPermissionAsync.calledWith('admin', 'assign-admin-role')).to.be.true;
	});

	it('requires a name for a new user when Accounts_RequireNameForSignUp is on', async () => {
		settingsGet.withArgs('Accounts_RequireNameForSignUp').returns(true);

		await expect(validateUserData('admin', { ...newUser, name: '   ' })).to.be.rejectedWith(
			'The field Name is required [error-the-field-is-required]',
		);
	});

	it('does not require a name on an update when Accounts_RequireNameForSignUp is on', async () => {
		settingsGet.withArgs('Accounts_RequireNameForSignUp').returns(true);

		await validateUserData('admin', { _id: 'uid', name: '' });
	});

	it('requires a username for a new user', async () => {
		await expect(validateUserData('admin', { ...newUser, username: '  ' })).to.be.rejectedWith(
			'The field Username is required [error-the-field-is-required]',
		);
	});

	it('refuses a username that does not match UTF8_User_Names_Validation, escaping it in the message', async () => {
		await expect(validateUserData('admin', { _id: 'uid', username: '<b>' })).to.be.rejectedWith(
			'&lt;b&gt; is not a valid username [error-input-is-not-a-valid-field]',
		);
	});

	it('falls back to the default username pattern when UTF8_User_Names_Validation is not a valid regex', async () => {
		settingsGet.withArgs('UTF8_User_Names_Validation').returns('[');

		await validateUserData('admin', { _id: 'uid', username: 'jane.doe' });
		await expect(validateUserData('admin', { _id: 'uid', username: 'jane doe' })).to.be.rejectedWith(
			'jane doe is not a valid username [error-input-is-not-a-valid-field]',
		);
	});

	it('requires a password for a new user', async () => {
		await expect(validateUserData('admin', { ...newUser, password: '' })).to.be.rejectedWith(
			'The field Password is required [error-the-field-is-required]',
		);
	});

	it('accepts a new user without password when a random password is requested', async () => {
		await validateUserData('admin', { ...newUser, password: undefined, setRandomPassword: true });
	});

	it('refuses a new user whose username is taken, without checking the email', async () => {
		checkUsernameAvailability.resolves(false);

		await expect(validateUserData('admin', newUser)).to.be.rejectedWith('jane is already in use :( [error-field-unavailable]');
		expect(checkEmailAvailability.called).to.be.false;
	});

	it('refuses a new user whose email is taken, escaping it in the message', async () => {
		checkEmailAvailability.resolves(false);

		await expect(validateUserData('admin', { ...newUser, email: 'a&b@example.com' })).to.be.rejectedWith(
			'a&amp;b@example.com is already in use :( [error-field-unavailable]',
		);
	});

	it('skips the email availability check for a new user without email', async () => {
		await validateUserData('admin', { ...newUser, email: undefined });

		expect(checkEmailAvailability.called).to.be.false;
	});

	it('does not check availability on an update', async () => {
		await validateUserData('admin', { _id: 'uid', username: 'jane', email: 'jane@example.com' });

		expect(checkUsernameAvailability.called).to.be.false;
		expect(checkEmailAvailability.called).to.be.false;
	});

	it('does not check availability when the username is invalid', async () => {
		await expect(validateUserData('admin', { ...newUser, username: 'jane doe' })).to.be.rejectedWith('[error-input-is-not-a-valid-field]');

		expect(checkUsernameAvailability.called).to.be.false;
	});
});
