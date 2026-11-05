import { ClientSafeError } from '../src/ClientSafeError';

describe('ClientSafeError', () => {
	it('should create an error with no reason like Meteor.Error', () => {
		const error = new ClientSafeError('no reason');

		const stringfiedError = { isClientSafe: true, errorType: 'Meteor.Error', error: 'no reason', message: '[no reason]' };

		expect(error.error).toBe('no reason');
		expect(error.reason).toBeUndefined();
		expect(error.message).toBe('[no reason]');
		expect(error.details).toBeUndefined();
		expect(error.isClientSafe).toBe(true);
		expect(error.errorType).toBe('Meteor.Error');
		expect(JSON.parse(JSON.stringify(error))).toEqual(stringfiedError);
	});
	it('should create an error with reason like Meteor.Error', () => {
		const error = new ClientSafeError('some message', 'some reason');

		const stringfiedError = {
			isClientSafe: true,
			errorType: 'Meteor.Error',
			error: 'some message',
			message: 'some reason [some message]',
			reason: 'some reason',
		};

		expect(error.error).toBe('some message');
		expect(error.reason).toBe('some reason');
		expect(error.message).toBe('some reason [some message]');
		expect(error.details).toBeUndefined();
		expect(error.isClientSafe).toBe(true);
		expect(error.errorType).toBe('Meteor.Error');
		expect(JSON.parse(JSON.stringify(error))).toEqual(stringfiedError);
	});
	it('should create an error with reason and details like Meteor.Error', () => {
		const error = new ClientSafeError('some message', 'some reason', { some: 'details' });

		const stringfiedError = {
			isClientSafe: true,
			errorType: 'Meteor.Error',
			error: 'some message',
			message: 'some reason [some message]',
			reason: 'some reason',
			details: { some: 'details' },
		};

		expect(error.error).toBe('some message');
		expect(error.reason).toBe('some reason');
		expect(error.message).toBe('some reason [some message]');
		expect(error.details).toEqual({ some: 'details' });
		expect(error.isClientSafe).toBe(true);
		expect(error.errorType).toBe('Meteor.Error');
		expect(JSON.parse(JSON.stringify(error))).toEqual(stringfiedError);
	});
});
