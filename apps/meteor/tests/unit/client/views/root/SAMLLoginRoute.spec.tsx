import { MockedServerContext, MockedUserContext } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import sinon from 'sinon';

import SAMLLoginRoute from '../../../../../client/views/root/SAMLLoginRoute';
import RouterContextMock from '../../../../mocks/client/RouterContextMock';

const loginWithSamlTokenStub = Meteor.loginWithSamlToken as sinon.SinonStub;
const navigateStub = sinon.stub();

describe('views/root/SAMLLoginRoute', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		navigateStub.resetHistory();
		loginWithSamlTokenStub.reset();
		loginWithSamlTokenStub.callsFake((_token, callback) => callback());
	});

	it('should redirect to /home when userId is not null', async () => {
		render(
			<MockedServerContext>
				<MockedUserContext>
					<RouterContextMock searchParameters={{ redirectUrl: 'http://rocket.chat' }} navigate={navigateStub}>
						<SAMLLoginRoute />
					</RouterContextMock>
				</MockedUserContext>
			</MockedServerContext>,
		);

		expect(navigateStub.calledTwice).toBe(true);
		expect(
			navigateStub.calledWith(
				sinon.match({
					pathname: '/home',
				}),
			),
		).toBe(true);
	});

	it('should redirect to /home when userId is null and redirectUrl is not within the workspace domain', async () => {
		render(
			<MockedServerContext>
				<RouterContextMock searchParameters={{ redirectUrl: 'http://rocket.chat' }} navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedServerContext>,
		);

		expect(
			navigateStub.calledOnceWith(
				sinon.match({
					pathname: '/home',
				}),
			),
		).toBe(true);
	});

	it('should redirect to the provided redirectUrl when userId is null and redirectUrl is within the workspace domain', async () => {
		render(
			<MockedServerContext>
				<RouterContextMock searchParameters={{ redirectUrl: 'http://localhost:3000/invite/test' }} navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedServerContext>,
		);

		expect(
			navigateStub.calledOnceWith(
				sinon.match({
					pathname: '/invite/test',
				}),
			),
		).toBe(true);
	});

	it('should call loginWithSamlToken when component is mounted', async () => {
		render(
			<MockedServerContext>
				<RouterContextMock searchParameters={{ redirectUrl: 'http://rocket.chat' }} navigate={navigateStub}>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedServerContext>,
		);

		expect(loginWithSamlTokenStub.calledOnceWith(undefined)).toBe(true);
	});

	it('should call loginWithSamlToken with the token when it is present', async () => {
		render(
			<MockedUserContext>
				<RouterContextMock
					searchParameters={{ redirectUrl: 'http://rocket.chat' }}
					routeParameters={{ token: 'testToken' }}
					navigate={navigateStub}
				>
					<SAMLLoginRoute />
				</RouterContextMock>
			</MockedUserContext>,
		);

		expect(loginWithSamlTokenStub.calledOnceWith('testToken')).toBe(true);
	});
});
