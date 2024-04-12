import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import proxyquire from 'proxyquire';
import React from 'react';
import sinon from 'sinon';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';

const loginWithSamlTokenStub = sinon.stub();
const navigateStub = sinon.stub();

const { SAMLLoginRoute } = proxyquire.noCallThru().load('../../../../../client/views/root/SAMLLoginRoute.tsx', {
	'meteor/meteor': {
		Meteor: {
			loginWithSamlToken: loginWithSamlTokenStub,
		},
	},
});

describe('views/root/SAMLLoginRoute', () => {
	beforeAll(() => {
		loginWithSamlTokenStub.callsFake((_token, callback) => callback());
	});

	it('should look good', async () => {
		render(
			<RouterContextMock searchParameters={{ redirectUrl: 'test' }} navigate={navigateStub}>
				<SAMLLoginRoute />
			</RouterContextMock>,
		);

		expect(
			navigateStub.calledWith(
				sinon.match({
					pathname: '/home',
				}),
			),
		).to.be.true;
	});
});
