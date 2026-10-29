import type { CallContact } from '@rocket.chat/media-signaling';

import { derivePeerInfoFromInstanceContact } from './derivePeerInfoFromInstanceContact';

describe('derivePeerInfoFromInstanceContact', () => {
	describe('SIP contact', () => {
		it('returns external peer info with number from contact id', () => {
			const contact: CallContact = {
				type: 'sip',
				id: '+5511999999999',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'sip',
				number: '+5511999999999',
			});
		});

		it('returns external peer info with "unknown" when id is missing', () => {
			const contact: CallContact = {
				type: 'sip',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'sip',
				number: 'unknown',
			});
		});

		it('returns external peer info with "unknown" when id is empty string', () => {
			const contact: CallContact = {
				type: 'sip',
				id: '',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'sip',
				number: 'unknown',
			});
		});

		it('returns external peer info with displayName when provided', () => {
			const contact: CallContact = {
				type: 'sip',
				id: '+5511999999999',
				displayName: 'Customer Support',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'sip',
				number: '+5511999999999',
				displayName: 'Customer Support',
			});
		});
	});

	describe('user contact', () => {
		it('returns internal peer info with all fields when provided', () => {
			const contact: CallContact = {
				type: 'user',
				id: 'userId123',
				displayName: 'John Doe',
				username: 'johndoe',
				sipExtension: '1001',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'user',
				displayName: 'John Doe',
				userId: 'userId123',
				username: 'johndoe',
				callerId: '1001',
			});
		});

		it('returns unknown peer info for missing id', () => {
			const contact: CallContact = {
				type: 'user',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'unknown',
			});
		});

		it('returns internal peer info with optional username and callerId when provided', () => {
			const contact: CallContact = {
				type: 'user',
				id: 'userId456',
				displayName: 'Jane Smith',
				username: 'janesmith',
				sipExtension: '1002',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'user',
				displayName: 'Jane Smith',
				userId: 'userId456',
				username: 'janesmith',
				callerId: '1002',
			});
		});

		it('returns unknown peer info for empty string id', () => {
			const contact: CallContact = {
				type: 'user',
				id: '',
				displayName: '',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'unknown',
			});
		});
	});

	describe('contact without identity', () => {
		it('returns unknown peer info when contact has no type or id', () => {
			const contact = {} as CallContact;
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				type: 'unknown',
			});
		});
	});
});
