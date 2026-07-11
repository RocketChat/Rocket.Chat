import { expect } from 'chai';
import { describe, it } from 'mocha';

import { resolveMailbox } from '../../../../../ee/server/lib/calendarSync/mailboxResolver';

describe('calendarSync/mailboxResolver', () => {
	describe('email source', () => {
		it('should resolve the first verified email address', () => {
			const user = {
				emails: [
					{ address: 'unverified@example.com', verified: false },
					{ address: 'verified@example.com', verified: true },
				],
			};
			expect(resolveMailbox(user, 'email')).to.equal('verified@example.com');
		});

		it('should return null when the user only has unverified emails', () => {
			const user = { emails: [{ address: 'unverified@example.com', verified: false }] };
			expect(resolveMailbox(user, 'email')).to.be.null;
		});

		it('should return null when the user has no emails', () => {
			expect(resolveMailbox({}, 'email')).to.be.null;
		});

		it('should skip verified entries that are not valid email addresses', () => {
			const user = { emails: [{ address: 'not-an-email', verified: true }] };
			expect(resolveMailbox(user, 'email')).to.be.null;
		});
	});

	describe('custom-field source', () => {
		it('should resolve a valid email from the configured custom field', () => {
			const user = { customFields: { mailbox: ' corp.user@example.mil ' } };
			expect(resolveMailbox(user, 'custom-field', 'mailbox')).to.equal('corp.user@example.mil');
		});

		it('should return null when the custom field is missing or invalid', () => {
			expect(resolveMailbox({ customFields: {} }, 'custom-field', 'mailbox')).to.be.null;
			expect(resolveMailbox({ customFields: { mailbox: 'nope' } }, 'custom-field', 'mailbox')).to.be.null;
			expect(resolveMailbox({ customFields: { mailbox: 42 } }, 'custom-field', 'mailbox')).to.be.null;
		});

		it('should return null when no custom field name is configured', () => {
			expect(resolveMailbox({ customFields: { mailbox: 'a@b.co' } }, 'custom-field')).to.be.null;
		});
	});
});
