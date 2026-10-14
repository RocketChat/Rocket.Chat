import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { MockedServerContext, MockedSettingsContext, MockedUserContext } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike, Mock, Mocked } from 'jest-mock';

import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';
import { enterModuleScope, leaveModuleScope } from '../../../tests/mocks/moduleScope';

let Meteor: (typeof import('meteor/meteor'))['Meteor'];
let SAMLLoginRoute: (typeof import('./SAMLLoginRoute'))['default'];
let useSamlInviteToken: (typeof import('../invite/hooks/useSamlInviteToken'))['useSamlInviteToken'];
let mockUseSamlInviteToken: Mocked<typeof useSamlInviteToken>;

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);
const buildAuthDeeplinkURLMock = {
	buildSamlDeepLinkURL: fn<FunctionLike>(),
};
const navigateStub = fn<FunctionLike>();

describe('SAMLLoginRoute', () => {
	before(() => {
		enterModuleScope();
		mock.module('../invite/hooks/useSamlInviteToken', { exports: { useSamlInviteToken: fn() } });
		mock.module('../../lib/buildAuthDeeplinkURL', { exports: buildAuthDeeplinkURLMock });
		({ Meteor } = require('meteor/meteor'));
		({ default: SAMLLoginRoute } = require('./SAMLLoginRoute'));
		({ useSamlInviteToken } = require('../invite/hooks/useSamlInviteToken'));
		mockUseSamlInviteToken = mocked(useSamlInviteToken);
	});

	after(leaveModuleScope);

	before(() => {
		spyOn(Storage.prototype, 'getItem');
	});

	beforeEach(() => {
		mocker.clearAllMocks();
		navigateStub.mockClear();
		(Meteor.loginWithSamlToken as Mock<(...args: any[]) => any>).mockClear();
	});

	it('should redirect to /home', async () => {
		mockUseSamlInviteToken.mockReturnValue([null, () => ({})]);
		render(
			<MockedServerContext>
				<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: true }}>
					<MockedUserContext>
						<RouterContextMock navigate={navigateStub}>
							<SAMLLoginRoute />
						</RouterContextMock>
					</MockedUserContext>
				</MockedSettingsContext>
			</MockedServerContext>,
		);

		expect(navigateStub).toHaveBeenCalledTimes(1);
		expect(navigateStub).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/home' }), expect.anything());
	});

	it('should redirect to /home when userId is null and the stored invite token is not valid', async () => {
		mockUseSamlInviteToken.mockReturnValue([null, () => ({})]);
		render(
			<MockedServerContext>
				<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: true }}>
					<RouterContextMock searchParameters={{ redirectUrl: 'http://rocket.chat' }} navigate={navigateStub}>
						<SAMLLoginRoute />
					</RouterContextMock>
				</MockedSettingsContext>
			</MockedServerContext>,
		);

		expect(navigateStub).toHaveBeenCalledTimes(1);
		expect(navigateStub).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/home' }), expect.anything());
	});

	it('should redirect to the invite page with the stored invite token when it is valid', async () => {
		mockUseSamlInviteToken.mockReturnValue(['test', () => ({})]);
		render(
			<MockedServerContext>
				<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: true }}>
					<RouterContextMock navigate={navigateStub}>
						<SAMLLoginRoute />
					</RouterContextMock>
				</MockedSettingsContext>
			</MockedServerContext>,
		);

		expect(navigateStub).toHaveBeenCalledTimes(1);
		expect(navigateStub).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/invite/test' }), expect.anything());
	});

	it('should call loginWithSamlToken when component is mounted', async () => {
		render(
			<MockedServerContext>
				<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: true }}>
					<RouterContextMock navigate={navigateStub}>
						<SAMLLoginRoute />
					</RouterContextMock>
				</MockedSettingsContext>
			</MockedServerContext>,
		);

		expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
		expect(Meteor.loginWithSamlToken).toHaveBeenLastCalledWith(undefined, expect.any(Function));
	});

	it('should call loginWithSamlToken with the token when it is present', async () => {
		render(
			<MockedUserContext>
				<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: true }}>
					<RouterContextMock routeParameters={{ token: 'testToken' }} navigate={navigateStub}>
						<SAMLLoginRoute />
					</RouterContextMock>
				</MockedSettingsContext>
			</MockedUserContext>,
		);

		expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
		expect(Meteor.loginWithSamlToken).toHaveBeenLastCalledWith('testToken', expect.any(Function));
	});

	describe('native client handoff', () => {
		const { buildSamlDeepLinkURL } = buildAuthDeeplinkURLMock as { buildSamlDeepLinkURL: Mock<FunctionLike> };

		const navigableDeepLink = `${window.location.origin}/#deep-link`;

		beforeEach(() => {
			mockUseSamlInviteToken.mockReturnValue([null, () => ({})]);
			buildSamlDeepLinkURL.mockReturnValue(navigableDeepLink);
		});

		afterEach(() => {
			window.location.hash = '';
		});

		['mobile', 'desktop'].forEach((loginClient) => {
			it(`should hand the credential token to the ${loginClient} client without logging in`, async () => {
				render(
					<MockedServerContext>
						<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: true }}>
							<RouterContextMock routeParameters={{ token: 'testToken' }} searchParameters={{ loginClient }} navigate={navigateStub}>
								<SAMLLoginRoute />
							</RouterContextMock>
						</MockedSettingsContext>
					</MockedServerContext>,
				);

				// The browser must never authenticate: the app redeems the credential on its own connection.
				expect(Meteor.loginWithSamlToken).not.toHaveBeenCalled();
				expect(navigateStub).not.toHaveBeenCalled();

				expect(buildSamlDeepLinkURL).toHaveBeenCalledTimes(1);
				expect(buildSamlDeepLinkURL).toHaveBeenLastCalledWith('testToken');
				expect(window.location.href).toBe(navigableDeepLink);
			});
		});

		it('should log in normally for an unrecognized loginClient', async () => {
			render(
				<MockedServerContext>
					<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: true }}>
						<RouterContextMock routeParameters={{ token: 'testToken' }} searchParameters={{ loginClient: 'web' }} navigate={navigateStub}>
							<SAMLLoginRoute />
						</RouterContextMock>
					</MockedSettingsContext>
				</MockedServerContext>,
			);

			expect(buildSamlDeepLinkURL).not.toHaveBeenCalled();
			expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
		});

		it('should ignore loginClient and log in normally when the modern flow is disabled', async () => {
			render(
				<MockedServerContext>
					<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: false }}>
						<RouterContextMock
							routeParameters={{ token: 'testToken' }}
							searchParameters={{ loginClient: 'desktop' }}
							navigate={navigateStub}
						>
							<SAMLLoginRoute />
						</RouterContextMock>
					</MockedSettingsContext>
				</MockedServerContext>,
			);

			expect(buildSamlDeepLinkURL).not.toHaveBeenCalled();
			expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
		});
	});
});
