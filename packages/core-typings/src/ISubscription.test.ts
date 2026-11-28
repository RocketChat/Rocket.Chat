import assert from 'node:assert';
import { describe, it } from 'node:test';

import type { ISubscription } from './ISubscription';
import { isBannedSubscription, isInviteSubscription } from './ISubscription';

describe('ISubscription type guards', () => {
	describe('isBannedSubscription', () => {
		it('should return true for a subscription with BANNED status', () => {
			const sub = { status: 'BANNED' } as ISubscription;
			assert.equal(isBannedSubscription(sub), true);
		});

		it('should return false for a subscription with INVITED status', () => {
			const sub = { status: 'INVITED' } as ISubscription;
			assert.equal(isBannedSubscription(sub), false);
		});

		it('should return false for a subscription with no status', () => {
			const sub = {} as ISubscription;
			assert.equal(isBannedSubscription(sub), false);
		});

		it('should return false for a subscription with undefined status', () => {
			const sub = { status: undefined } as unknown as ISubscription;
			assert.equal(isBannedSubscription(sub), false);
		});
	});

	describe('isInviteSubscription', () => {
		it('should return true for a subscription with INVITED status and inviter', () => {
			const sub = {
				status: 'INVITED',
				inviter: { _id: 'user1', username: 'testuser' },
			} as ISubscription;
			assert.equal(isInviteSubscription(sub), true);
		});

		it('should return false for a subscription with INVITED status but no inviter', () => {
			const sub = { status: 'INVITED' } as ISubscription;
			assert.equal(isInviteSubscription(sub), false);
		});

		it('should return false for a BANNED subscription', () => {
			const sub = { status: 'BANNED' } as ISubscription;
			assert.equal(isInviteSubscription(sub), false);
		});
	});
});
