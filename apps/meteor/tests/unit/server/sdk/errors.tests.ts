import { expect } from 'chai';

import { MeteorError } from '../../../../server/sdk/errors';

describe('MeteorError', () => {
	it('should create an error with no reason like Meteor.Error', () => {
		const error = new MeteorError('no reason');

		const stringfiedError = { isClientSafe: true, errorType: 'Meteor.Error', error: 'no reason', message: '[no reason]' };

		expect(error.error).to.equal('no reason');
		expect(error.reason).to.be.undefined;
		expect(error.message).to.equal('[no reason]');
		expect(error.details).to.be.undefined;
		expect(error.isClientSafe).to.be.true;
		expect(error.errorType).to.equal('Meteor.Error');
		expect(JSON.parse(JSON.stringify(error))).to.deep.equal(stringfiedError);
	});
	it('should create an error with reason like Meteor.Error', () => {
		const error = new MeteorError('some message', 'some reason');

		const stringfiedError = {
			isClientSafe: true,
			errorType: 'Meteor.Error',
			error: 'some message',
			message: 'some reason [some message]',
			reason: 'some reason',
		};

		expect(error.error).to.equal('some message');
		expect(error.reason).to.equal('some reason');
		expect(error.message).to.equal('some reason [some message]');
		expect(error.details).to.be.undefined;
		expect(error.isClientSafe).to.be.true;
		expect(error.errorType).to.equal('Meteor.Error');
		expect(JSON.parse(JSON.stringify(error))).to.deep.equal(stringfiedError);
	});
	it('should create an error with reason and details like Meteor.Error', () => {
		const error = new MeteorError('some message', 'some reason', { some: 'details' });

		const stringfiedError = {
			isClientSafe: true,
			errorType: 'Meteor.Error',
			error: 'some message',
			message: 'some reason [some message]',
			reason: 'some reason',
			details: { some: 'details' },
		};

		expect(error.error).to.equal('some message');
		expect(error.reason).to.equal('some reason');
		expect(error.message).to.equal('some reason [some message]');
		expect(error.details).to.be.deep.equal({ some: 'details' });
		expect(error.isClientSafe).to.be.true;
		expect(error.errorType).to.equal('Meteor.Error');
		expect(JSON.parse(JSON.stringify(error))).to.deep.equal(stringfiedError);
	});
});
