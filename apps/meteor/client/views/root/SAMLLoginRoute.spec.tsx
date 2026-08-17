import { MockedServerContext, MockedSettingsContext, MockedUserContext } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { Meteor } from 'meteor/meteor';

import SAMLLoginRoute from './SAMLLoginRoute';
import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';
import { useSamlInviteToken } from '../invite/hooks/useSamlInviteToken';

jest.mock('../invite/hooks/useSamlInviteToken');
const mockUseSamlInviteToken = jest.mocked(useSamlInviteToken);
const navigateStub = jest.fn();

beforeAll(() => {
	jest.spyOn(Storage.prototype, 'getItem');
});

beforeEach(() => {
	jest.clearAllMocks();
	navigateStub.mockClear();
	(Meteor.loginWithSamlToken as jest.Mock<any>).mockClear();
});

it('should redirect to /home', async () => {
	mockUseSamlInviteToken.mockReturnValue([null, () => ({})]);
	render(
		<MockedServerContext>
			<MockedUserContext>
				<RouterContextMock navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedUserContext>
		</MockedServerContext>,
	);

	expect(navigateStub).toHaveBeenCalledTimes(1);
	expect(navigateStub).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/home' }), expect.anything());
});

it('should redirect to /home when userId is null and the stored invite token is not valid', async () => {
	mockUseSamlInviteToken.mockReturnValue([null, () => ({})]);
	render(
		<MockedServerContext>
			<RouterContextMock searchParameters={{ redirectUrl: 'http://rocket.chat' }} navigate={navigateStub}>
				<SAMLLoginRoute />
			</RouterContextMock>
		</MockedServerContext>,
	);

	expect(navigateStub).toHaveBeenCalledTimes(1);
	expect(navigateStub).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/home' }), expect.anything());
});

it('should redirect to the invite page with the stored invite token when it is valid', async () => {
	mockUseSamlInviteToken.mockReturnValue(['test', () => ({})]);
	render(
		<MockedServerContext>
			<RouterContextMock navigate={navigateStub}>
				<SAMLLoginRoute />
			</RouterContextMock>
		</MockedServerContext>,
	);

	expect(navigateStub).toHaveBeenCalledTimes(1);
	expect(navigateStub).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/invite/test' }), expect.anything());
});

it('should call loginWithSamlToken when component is mounted', async () => {
	render(
		<MockedServerContext>
			<RouterContextMock navigate={navigateStub}>
				<SAMLLoginRoute />
			</RouterContextMock>
		</MockedServerContext>,
	);

	expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
	expect(Meteor.loginWithSamlToken).toHaveBeenLastCalledWith(undefined, expect.any(Function));
});

it('should call loginWithSamlToken with the token when it is present', async () => {
	render(
		<MockedUserContext>
			<RouterContextMock routeParameters={{ token: 'testToken' }} navigate={navigateStub}>
				<SAMLLoginRoute />
			</RouterContextMock>
		</MockedUserContext>,
	);

	expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
	expect(Meteor.loginWithSamlToken).toHaveBeenLastCalledWith('testToken', expect.any(Function));
});

jest.mock('../../lib/buildAuthDeeplinkURL', () => ({ buildSamlDeepLinkURL: jest.fn() }));

describe('native client handoff', () => {
	const { buildSamlDeepLinkURL } = jest.requireMock('../../lib/buildAuthDeeplinkURL') as { buildSamlDeepLinkURL: jest.Mock };

	const navigableDeepLink = `${window.location.origin}/#deep-link`;

	beforeEach(() => {
		mockUseSamlInviteToken.mockReturnValue([null, () => ({})]);
		buildSamlDeepLinkURL.mockReturnValue(navigableDeepLink);
	});

	afterEach(() => {
		window.location.hash = '';
	});

	it.each(['mobile', 'desktop'])('should hand the credential token to the %s client without logging in', async (loginClient) => {
		render(
			<MockedServerContext>
				<RouterContextMock routeParameters={{ token: 'testToken' }} searchParameters={{ loginClient }} navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedServerContext>,
		);

		// The browser must never authenticate: the app redeems the credential on its own connection.
		expect(Meteor.loginWithSamlToken).not.toHaveBeenCalled();
		expect(navigateStub).not.toHaveBeenCalled();

		expect(buildSamlDeepLinkURL).toHaveBeenCalledTimes(1);
		expect(buildSamlDeepLinkURL).toHaveBeenLastCalledWith('testToken');
		expect(window.location.href).toBe(navigableDeepLink);
	});

	it('should log in normally for an unrecognized loginClient', async () => {
		render(
			<MockedServerContext>
				<RouterContextMock routeParameters={{ token: 'testToken' }} searchParameters={{ loginClient: 'web' }} navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedServerContext>,
		);

		expect(buildSamlDeepLinkURL).not.toHaveBeenCalled();
		expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
	});

	it('should ignore loginClient and log in normally when the modern flow is disabled', async () => {
		render(
			<MockedServerContext>
				<MockedSettingsContext settings={{ Accounts_OAuth_Use_Modern_Flow: false }}>
					<RouterContextMock routeParameters={{ token: 'testToken' }} searchParameters={{ loginClient: 'desktop' }} navigate={navigateStub}>
						<SAMLLoginRoute />
					</RouterContextMock>
				</MockedSettingsContext>
			</MockedServerContext>,
		);

		expect(buildSamlDeepLinkURL).not.toHaveBeenCalled();
		expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
	});
});
