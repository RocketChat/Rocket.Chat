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
				number: '+5511999999999',
			});
		});

		it('returns external peer info with "unknown" when id is missing', () => {
			const contact: CallContact = {
				type: 'sip',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				number: 'unknown',
			});
		});

		it('returns external peer info with "unknown" when id is empty string', () => {
			const contact: CallContact = {
				type: 'sip',
				id: '',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				number: 'unknown',
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
				displayName: 'John Doe',
				userId: 'userId123',
				username: 'johndoe',
				callerId: '1001',
			});
		});

		it('returns internal peer info with "unknown" for missing displayName and id', () => {
			const contact: CallContact = {
				type: 'user',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				displayName: 'unknown',
				userId: 'unknown',
				username: undefined,
				callerId: undefined,
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
				displayName: 'Jane Smith',
				userId: 'userId456',
				username: 'janesmith',
				callerId: '1002',
			});
		});

		it('returns internal peer info with "unknown" for empty string displayName and id', () => {
			const contact: CallContact = {
				type: 'user',
				id: '',
				displayName: '',
			};
			expect(derivePeerInfoFromInstanceContact(contact)).toEqual({
				displayName: 'unknown',
				userId: 'unknown',
				username: undefined,
				callerId: undefined,
			});
		});
	});

	describe('invalid contact type', () => {
		it('throws when contact type is undefined (treated as user path but fails internal validation)', () => {
			const contact = {} as CallContact;
			expect(() => derivePeerInfoFromInstanceContact(contact)).toThrow(
				'deriveInternalPeerInfoFromInstanceContact: Contact is not a user contact',
			);
		});
	});
});
