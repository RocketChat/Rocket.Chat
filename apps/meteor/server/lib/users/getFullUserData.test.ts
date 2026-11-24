import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const settingsWatch = sinon.stub();
const loggerWarn = sinon.stub();
const hasPermissionAsync = sinon.stub();
const getUsersHiddenFrom = sinon.stub();
const redactHiddenUser = sinon.stub();
const resolveUsersByIds = sinon.stub();
const isAdminHidingAllowed = sinon.stub();
const isUserHidingAllowed = sinon.stub();

let getFullUserDataByUniqueSearchTerm: any;
let defaultFields: any;
let fullFields: any;
let defaultFieldsWithoutAbac: any;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/logger', {
			exports: {
				Logger: class {
					warn = loggerWarn;
				},
			},
		}),
		mock.module('../../settings', { exports: { settings: { get: settingsGet, watch: settingsWatch } } }),
		mock.module('../authorization/hasPermission', { exports: { hasPermissionAsync } }),
		mock.module('../statusVisibility/hiddenUsers', { exports: { getUsersHiddenFrom, redactHiddenUser } }),
		mock.module('../statusVisibility/resolveUsers', { exports: { resolveUsersByIds } }),
		mock.module('../statusVisibility/settings', { exports: { isAdminHidingAllowed, isUserHidingAllowed } }),
	];
	({ getFullUserDataByUniqueSearchTerm, defaultFields, fullFields } = await import('./getFullUserData'));
	const { abacAttributes: _abac, ...withoutAbac } = defaultFields;
	defaultFieldsWithoutAbac = withoutAbac;
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const setCustomFieldsSetting = (value: string) => settingsWatch.firstCall.args[1](value);

describe('getFullUserDataByUniqueSearchTerm', () => {
	let Users: Record<string, sinon.SinonStub>;

	const caller = {
		_id: 'caller',
		username: 'me',
		importIds: ['imp-1'],
		emails: [{ address: ' Me@Example.com ' }],
		sipExtension: '1000',
	};

	beforeEach(() => {
		Users = {
			findOneById: sinon.stub().resolves(caller),
			findOneByImportId: sinon.stub().callsFake(async () => ({ _id: 'target' })),
			findOneByEmailAddress: sinon.stub().callsFake(async () => ({ _id: 'target' })),
			findOneBySipExtension: sinon.stub().callsFake(async () => ({ _id: 'target' })),
			findOneByIdOrUsername: sinon.stub().callsFake(async () => ({ _id: 'target' })),
		};
		mockModel('Users', Users);
		[
			settingsGet,
			loggerWarn,
			hasPermissionAsync,
			getUsersHiddenFrom,
			redactHiddenUser,
			resolveUsersByIds,
			isAdminHidingAllowed,
			isUserHidingAllowed,
		].forEach((stub) => stub.reset());
		hasPermissionAsync.resolves(false);
		isAdminHidingAllowed.returns(false);
		isUserHidingAllowed.returns(false);
		getUsersHiddenFrom.resolves(new Set(['hidden']));
		redactHiddenUser.callsFake((user) => ({ ...user, redacted: true }));
		setCustomFieldsSetting('');
	});

	it('registers a watcher for Accounts_CustomFields', () => {
		expect(settingsWatch.firstCall.args[0]).to.equal('Accounts_CustomFields');
	});

	it('returns null without checking permissions when the caller does not exist', async () => {
		Users.findOneById.resolves(null);

		expect(await getFullUserDataByUniqueSearchTerm('caller', 'someone', 'username')).to.be.null;
		expect(Users.findOneById.calledOnceWith('caller', { projection: { username: 1, importIds: 1, emails: 1, sipExtension: 1 } })).to.be
			.true;
		expect(hasPermissionAsync.called).to.be.false;
		expect(Users.findOneByIdOrUsername.called).to.be.false;
	});

	(
		[
			['id', 'caller', 'findOneByIdOrUsername'],
			['username', 'me', 'findOneByIdOrUsername'],
			['importId', 'imp-1', 'findOneByImportId'],
			['sipExtension', '1000', 'findOneBySipExtension'],
			['email', 'me@EXAMPLE.com  ', 'findOneByEmailAddress'],
		] as const
	).forEach(([searchType, searchValue, finder]) => {
		it(`treats a ${searchType} search matching the caller as a search for itself`, async () => {
			const result = await getFullUserDataByUniqueSearchTerm('caller', searchValue, searchType);

			expect(Users[finder].calledOnceWith(searchValue, { projection: { ...defaultFieldsWithoutAbac, ...fullFields, services: 1 } })).to.be
				.true;
			expect(result).to.deep.equal({ _id: 'target', canViewAllInfo: true });
			expect(getUsersHiddenFrom.called).to.be.false;
			expect(redactHiddenUser.called).to.be.false;
		});
	});

	(
		[
			['importId', 'findOneByImportId'],
			['email', 'findOneByEmailAddress'],
		] as const
	).forEach(([searchType, finder]) => {
		it(`returns null for a ${searchType} search of another user without view-full-other-user-info`, async () => {
			expect(await getFullUserDataByUniqueSearchTerm('caller', 'other', searchType)).to.be.null;
			expect(hasPermissionAsync.calledOnceWith('caller', 'view-full-other-user-info')).to.be.true;
			expect(Users[finder].called).to.be.false;
		});
	});

	it('fetches only the default fields of another user and redacts what is hidden from the caller', async () => {
		const result = await getFullUserDataByUniqueSearchTerm('caller', 'other', 'username');

		expect(Users.findOneByIdOrUsername.calledOnceWith('other', { projection: defaultFieldsWithoutAbac })).to.be.true;
		expect(getUsersHiddenFrom.calledOnceWith('caller')).to.be.true;
		expect(redactHiddenUser.calledOnceWith({ _id: 'target', canViewAllInfo: false }, new Set(['hidden']))).to.be.true;
		expect(result).to.deep.equal({ _id: 'target', canViewAllInfo: false, redacted: true });
	});

	it('routes a sipExtension search of another user to findOneBySipExtension', async () => {
		await getFullUserDataByUniqueSearchTerm('caller', '2000', 'sipExtension');

		expect(Users.findOneBySipExtension.calledOnceWith('2000', { projection: defaultFieldsWithoutAbac })).to.be.true;
	});

	it('keeps abacAttributes in the projection when the PDP is local', async () => {
		settingsGet.withArgs('ABAC_PDP_Type').returns('local');

		await getFullUserDataByUniqueSearchTerm('caller', 'other', 'id');

		expect(Users.findOneByIdOrUsername.calledOnceWith('other', { projection: defaultFields })).to.be.true;
	});

	it('fetches the full fields of another user with view-full-other-user-info, plus the admin block list when admin hiding is allowed', async () => {
		hasPermissionAsync.resolves(true);
		isAdminHidingAllowed.returns(true);

		const result = await getFullUserDataByUniqueSearchTerm('caller', 'other@example.com', 'email');

		expect(
			Users.findOneByEmailAddress.calledOnceWith('other@example.com', {
				projection: { ...defaultFieldsWithoutAbac, ...fullFields, statusVisibilityDeniedByAdmin: 1 },
			}),
		).to.be.true;
		expect(result).to.deep.equal({ _id: 'target', canViewAllInfo: true, redacted: true });
	});

	it('does not fetch the admin block list without view-full-other-user-info', async () => {
		isAdminHidingAllowed.returns(true);

		await getFullUserDataByUniqueSearchTerm('caller', 'other', 'username');

		expect(Users.findOneByIdOrUsername.firstCall.args[1].projection).to.not.have.property('statusVisibilityDeniedByAdmin');
	});

	it('fetches the own block list when searching for itself and user hiding is allowed', async () => {
		isUserHidingAllowed.returns(true);

		await getFullUserDataByUniqueSearchTerm('caller', 'caller', 'id');

		expect(
			Users.findOneByIdOrUsername.calledOnceWith('caller', {
				projection: { ...defaultFieldsWithoutAbac, ...fullFields, 'services': 1, 'settings.preferences.statusVisibilityDenied': 1 },
			}),
		).to.be.true;
	});

	it('returns null when the searched user does not exist', async () => {
		Users.findOneByIdOrUsername.resolves(null);

		expect(await getFullUserDataByUniqueSearchTerm('caller', 'other', 'username')).to.be.null;
		expect(getUsersHiddenFrom.called).to.be.false;
	});

	it('replaces the password service with true and strips password history, resume and email services', async () => {
		Users.findOneByIdOrUsername.resolves({
			_id: 'caller',
			services: {
				password: { bcrypt: 'hash' },
				passwordHistory: ['old'],
				resume: { loginTokens: [] },
				email: { verificationTokens: [] },
				google: { id: 'g' },
			},
		});

		const result = await getFullUserDataByUniqueSearchTerm('caller', 'caller', 'id');

		expect(result).to.deep.equal({ _id: 'caller', canViewAllInfo: true, services: { password: true, google: { id: 'g' } } });
	});

	it('resolves the own and admin block lists to usernames in one lookup, dropping unknown ids', async () => {
		isUserHidingAllowed.returns(true);
		Users.findOneByIdOrUsername.resolves({
			_id: 'caller',
			settings: { preferences: { statusVisibilityDenied: ['u1', 'u2'] } },
			statusVisibilityDeniedByAdmin: ['u2', 'u3'],
		});
		resolveUsersByIds.resolves({ ids: ['u1', 'u2'], usernames: ['one', 'two'] });

		const result = await getFullUserDataByUniqueSearchTerm('caller', 'caller', 'id');

		expect(resolveUsersByIds.calledOnceWith(['u1', 'u2', 'u3'])).to.be.true;
		expect(result).to.deep.equal({
			_id: 'caller',
			canViewAllInfo: true,
			settings: { preferences: { statusVisibilityDenied: ['one', 'two'] } },
			statusVisibilityDeniedByAdmin: ['two'],
		});
	});

	it('leaves the own block list as ids when user hiding is not allowed', async () => {
		hasPermissionAsync.resolves(true);
		Users.findOneByIdOrUsername.resolves({
			_id: 'caller',
			settings: { preferences: { statusVisibilityDenied: ['u1'] } },
			statusVisibilityDeniedByAdmin: ['u3'],
		});
		resolveUsersByIds.resolves({ ids: ['u1', 'u3'], usernames: ['one', 'three'] });

		const result = await getFullUserDataByUniqueSearchTerm('caller', 'caller', 'id');

		expect(resolveUsersByIds.calledOnceWith(['u3'])).to.be.true;
		expect(result.settings.preferences.statusVisibilityDenied).to.deep.equal(['u1']);
		expect(result.statusVisibilityDeniedByAdmin).to.deep.equal(['three']);
	});

	it('does not resolve the block list of another user, only its admin block list', async () => {
		isUserHidingAllowed.returns(true);
		hasPermissionAsync.resolves(true);
		Users.findOneByIdOrUsername.resolves({
			_id: 'target',
			settings: { preferences: { statusVisibilityDenied: ['u1'] } },
			statusVisibilityDeniedByAdmin: ['u3'],
		});
		resolveUsersByIds.resolves({ ids: ['u3'], usernames: ['three'] });

		await getFullUserDataByUniqueSearchTerm('caller', 'other', 'username');

		expect(resolveUsersByIds.calledOnceWith(['u3'])).to.be.true;
		expect(redactHiddenUser.firstCall.args[0]).to.deep.include({
			settings: { preferences: { statusVisibilityDenied: ['u1'] } },
			statusVisibilityDeniedByAdmin: ['three'],
		});
	});

	it('does not resolve usernames when both block lists are empty', async () => {
		isUserHidingAllowed.returns(true);
		Users.findOneByIdOrUsername.resolves({
			_id: 'caller',
			settings: { preferences: { statusVisibilityDenied: [] } },
			statusVisibilityDeniedByAdmin: [],
		});

		const result = await getFullUserDataByUniqueSearchTerm('caller', 'caller', 'id');

		expect(resolveUsersByIds.called).to.be.false;
		expect(result.statusVisibilityDeniedByAdmin).to.deep.equal([]);
	});

	describe('custom fields', () => {
		it('adds only public custom fields for another user and all of them for the caller', async () => {
			setCustomFieldsSetting(JSON.stringify({ team: { public: true }, salary: { public: false } }));

			await getFullUserDataByUniqueSearchTerm('caller', 'other', 'username');
			await getFullUserDataByUniqueSearchTerm('caller', 'caller', 'id');

			expect(Users.findOneByIdOrUsername.firstCall.args[1].projection).to.deep.equal({
				...defaultFieldsWithoutAbac,
				'customFields.team': 1,
			});
			expect(Users.findOneByIdOrUsername.secondCall.args[1].projection).to.deep.equal({
				...defaultFieldsWithoutAbac,
				...fullFields,
				'customFields.team': 1,
				'customFields.salary': 1,
				'services': 1,
			});
		});

		it('warns and adds no custom fields when the setting is invalid JSON', async () => {
			setCustomFieldsSetting(JSON.stringify({ team: { public: true } }));
			setCustomFieldsSetting('{invalid');

			await getFullUserDataByUniqueSearchTerm('caller', 'caller', 'id');

			expect(loggerWarn.calledOnce).to.be.true;
			expect(Users.findOneByIdOrUsername.firstCall.args[1].projection).to.deep.equal({
				...defaultFieldsWithoutAbac,
				...fullFields,
				services: 1,
			});
		});
	});
});
