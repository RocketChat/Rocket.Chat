import type { ISubscription } from '@rocket.chat/core-typings';
import { isBannedSubscription, isInviteSubscription } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('ISubscription type guards', () => {
	describe('isBannedSubscription', () => {
		it('should return true for a subscription with BANNED status', () => {
			const sub = { status: 'BANNED' } as ISubscription;
			expect(isBannedSubscription(sub)).to.be.true;
		});

		it('should return false for a subscription with INVITED status', () => {
			const sub = { status: 'INVITED' } as ISubscription;
			expect(isBannedSubscription(sub)).to.be.false;
		});

		it('should return false for a subscription with no status', () => {
			const sub = {} as ISubscription;
			expect(isBannedSubscription(sub)).to.be.false;
		});

		it('should return false for a subscription with undefined status', () => {
			const sub = { status: undefined } as unknown as ISubscription;
			expect(isBannedSubscription(sub)).to.be.false;
		});
	});

	describe('isInviteSubscription', () => {
		it('should return true for a subscription with INVITED status and inviter', () => {
			const sub = {
				status: 'INVITED',
				inviter: { _id: 'user1', username: 'testuser' },
			} as ISubscription;
			expect(isInviteSubscription(sub)).to.be.true;
		});

		it('should return false for a subscription with INVITED status but no inviter', () => {
			const sub = { status: 'INVITED' } as ISubscription;
			expect(isInviteSubscription(sub)).to.be.false;
		});

		it('should return false for a BANNED subscription', () => {
			const sub = { status: 'BANNED' } as ISubscription;
			expect(isInviteSubscription(sub)).to.be.false;
		});
	});
});
