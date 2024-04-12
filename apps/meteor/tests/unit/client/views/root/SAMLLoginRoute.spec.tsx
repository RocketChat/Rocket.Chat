import { MockedUserContext } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import sinon from 'sinon';

import SAMLLoginRoute from '../../../../../client/views/root/SAMLLoginRoute';
import RouterContextMock from '../../../../mocks/client/RouterContextMock';

jest.mock('meteor/meteor');
const loginWithSamlTokenStub = Meteor.loginWithSamlToken;
const navigateStub = sinon.stub();

describe('views/root/SAMLLoginRoute', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		navigateStub.resetHistory();
	});

	it('should do nothing when userId is null', async () => {
		render(
			<RouterContextMock searchParameters={{ redirectUrl: 'test' }} navigate={navigateStub}>
				<SAMLLoginRoute />
			</RouterContextMock>,
		);

		expect(navigateStub.getCalls().length === 0).toBe(true);
	});

	it('should redirect to /home when userId is not null', async () => {
		render(
			<MockedUserContext>
				<RouterContextMock searchParameters={{ redirectUrl: 'test' }} navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedUserContext>,
		);

		expect(navigateStub.getCalls().length === 1).toBe(true);
	});

	it('should call loginWithSamlToken when component is mounted', async () => {
		render(
			<MockedUserContext>
				<RouterContextMock searchParameters={{ redirectUrl: 'test' }} navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedUserContext>,
		);

		expect(loginWithSamlTokenStub.mock.calls.length === 1).toBe(true);
		expect(loginWithSamlTokenStub.mock.calls[0][0]).toBe(undefined);
	});

	it('should call with the token when token is present', async () => {
		render(
			<MockedUserContext>
				<RouterContextMock searchParameters={{ redirectUrl: 'test' }} routeParameters={{ token: 'testToken' }} navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedUserContext>,
		);

		expect(loginWithSamlTokenStub.mock.calls.length === 1).toBe(true);
		expect(loginWithSamlTokenStub.mock.calls[0][0]).toBe('testToken');
	});
});
