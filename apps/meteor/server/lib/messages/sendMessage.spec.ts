import { expect } from 'chai';
import { describe, it } from 'mocha';

import { prepareMessageObject } from './sendMessage';

describe('sendMessage', () => {
	describe('prepareMessageObject', () => {
		it('should set ts if not provided', () => {
			const message: any = {};
			prepareMessageObject(message, 'rid123', { _id: 'u123', username: 'testuser', name: 'Test User' });
			expect(message.ts).to.be.a('date');
		});

		it('should preserve existing ts', () => {
			const date = new Date('2023-01-01T00:00:00.000Z');
			const message: any = { ts: date };
			prepareMessageObject(message, 'rid123', { _id: 'u123', username: 'testuser', name: 'Test User' });
			expect(message.ts).to.equal(date);
		});

		it('should set rid correctly', () => {
			const message: any = {};
			prepareMessageObject(message, 'rid123', { _id: 'u123', username: 'testuser', name: 'Test User' });
			expect(message.rid).to.equal('rid123');
		});

		it('should set user details correctly', () => {
			const message: any = {};
			prepareMessageObject(message, 'rid123', { _id: 'u123', username: 'testuser', name: 'Test User' });
			expect(message.u).to.be.an('object');
			expect(message.u._id).to.equal('u123');
			expect(message.u.username).to.equal('testuser');
			expect(message.u.name).to.equal('Test User');
		});

		it('should throw an error if username is not provided', () => {
			const message: any = {};
			expect(() => {
				prepareMessageObject(message, 'rid123', { _id: 'u123', name: 'Test User' });
			}).to.throw('error-invalid-user');
		});

		it('should delete tshow if it is not exactly true', () => {
			const message: any = { tshow: false };
			prepareMessageObject(message, 'rid123', { _id: 'u123', username: 'testuser', name: 'Test User' });
			expect(message).to.not.have.property('tshow');
		});
	});
});
