import { MockedServerContext, MockedUserContext } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { Meteor } from 'meteor/meteor';

import SAMLLoginRoute from './SAMLLoginRoute';
import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';

const navigateStub = jest.fn();
const getSessionStorageItemStub = jest.fn();

beforeAll(() => {
	jest.spyOn(Storage.prototype, 'getItem');
	Storage.prototype.getItem = getSessionStorageItemStub;
});

beforeEach(() => {
	jest.clearAllMocks();
	navigateStub.mockClear();
	(Meteor.loginWithSamlToken as jest.Mock<any>).mockClear();
	getSessionStorageItemStub.mockClear();
});

it('should redirect to /home', async () => {
	getSessionStorageItemStub.mockReturnValue(undefined);
	render(
		<MockedServerContext>
			<MockedUserContext>
				<RouterContextMock navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedUserContext>
		</MockedServerContext>,
		{ legacyRoot: true },
	);

	expect(getSessionStorageItemStub).toHaveBeenCalledTimes(1);
	expect(navigateStub).toHaveBeenCalledTimes(1);
	expect(navigateStub).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/home' }), expect.anything());
});

it('should redirect to /home when userId is null and the stored invite token is not valid', async () => {
	getSessionStorageItemStub.mockReturnValue(null);
	render(
		<MockedServerContext>
			<RouterContextMock searchParameters={{ redirectUrl: 'http://rocket.chat' }} navigate={navigateStub}>
				<SAMLLoginRoute />
			</RouterContextMock>
		</MockedServerContext>,
		{ legacyRoot: true },
	);

	expect(navigateStub).toHaveBeenCalledTimes(1);
	expect(navigateStub).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/home' }), expect.anything());
});

it('should redirect to the invite page with the stored invite token when it is valid', async () => {
	getSessionStorageItemStub.mockReturnValue('test');
	render(
		<MockedServerContext>
			<RouterContextMock navigate={navigateStub}>
				<SAMLLoginRoute />
			</RouterContextMock>
		</MockedServerContext>,
		{ legacyRoot: true },
	);

	expect(getSessionStorageItemStub).toHaveBeenCalledTimes(1);
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
		{ legacyRoot: true },
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
		{ legacyRoot: true },
	);

	expect(Meteor.loginWithSamlToken).toHaveBeenCalledTimes(1);
	expect(Meteor.loginWithSamlToken).toHaveBeenLastCalledWith('testToken', expect.any(Function));
});
