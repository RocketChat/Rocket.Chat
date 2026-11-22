import { afterEach, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('generateUsernameSuggestion', () => {
	const getStub = sinon.stub();
	const findOneByUsernameIgnoringCase = sinon.stub();
	const countByUsernameWithNumericSuffix = sinon.stub();

	const { generateUsernameSuggestion } = proxyquire.noCallThru().load('./getUsernameSuggestion', {
		'../../settings': { settings: { get: getStub } },
	});

	beforeEach(() => {
		getStub.reset();
		getStub.withArgs('UTF8_Names_Slugify').returns(true);
		getStub.withArgs('Accounts_DefaultUsernamePrefixSuggestion').returns('user');

		findOneByUsernameIgnoringCase.reset();
		findOneByUsernameIgnoringCase.resolves({ _id: 'existing-user' });
		countByUsernameWithNumericSuffix.reset();

		mockModel('Users', { findOneByUsernameIgnoringCase, countByUsernameWithNumericSuffix });
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should suggest the name when it is available', async () => {
		findOneByUsernameIgnoringCase.withArgs('john.doe').resolves(null);

		expect(await generateUsernameSuggestion({ name: 'John Doe' })).to.equal('john.doe');
		expect(countByUsernameWithNumericSuffix.called).to.be.false;
	});

	it('should continue the numbering of the name when every candidate is taken', async () => {
		countByUsernameWithNumericSuffix.resolves(2);
		findOneByUsernameIgnoringCase.withArgs('john.doe-2').resolves(null);

		expect(await generateUsernameSuggestion({ name: 'John Doe' })).to.equal('john.doe-2');
		expect(countByUsernameWithNumericSuffix.calledOnceWithExactly('john.doe')).to.be.true;
	});

	it('should skip numbers that are already taken', async () => {
		countByUsernameWithNumericSuffix.resolves(1);
		findOneByUsernameIgnoringCase.withArgs('john.doe-3').resolves(null);

		expect(await generateUsernameSuggestion({ name: 'John Doe' })).to.equal('john.doe-3');
	});
});
