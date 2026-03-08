import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('Query merge security - rid protection', () => {
	// Test helper to simulate the query merge logic with rid protection
	const createQueryWithProtection = () => {
		// This simulates the fixed pattern: rid is set first, then user query is spread with rid filtered out
		return (baseRid: string, userQuery: Record<string, unknown>) => ({
			rid: baseRid,
			...Object.fromEntries(
				Object.entries(userQuery).filter(([key]) => key !== 'rid'),
			),
		});
	};

	const createVulnerableQuery = () => {
		// This simulates the vulnerable pattern: user query is spread first, then rid is set
		return (baseRid: string, userQuery: Record<string, unknown>) => ({
			...userQuery,
			rid: baseRid,
		});
	};

	describe('Secure query merge pattern', () => {
		it('should prioritize server-side rid over user-provided rid in query', () => {
			const secureMerge = createQueryWithProtection();
			const userQuery = { rid: 'malicious-room-id', text: 'hello' };
			
			const result = secureMerge('legitimate-room-id', userQuery);
			
			// The server-set rid should be used, not the user-provided one
			expect(result.rid).to.equal('legitimate-room-id');
			// But other query parameters should still be preserved
			expect(result.text).to.equal('hello');
		});

		it('should allow other query parameters while protecting rid', () => {
			const secureMerge = createQueryWithProtection();
			const userQuery = { 
				rid: 'malicious-room-id', 
				'starred._id': { $in: ['user1'] },
				pinned: true,
				_hidden: false,
			};
			
			const result = secureMerge('legitimate-room-id', userQuery);
			
			expect(result.rid).to.equal('legitimate-room-id');
			expect(result['starred._id']).to.deep.equal({ $in: ['user1'] });
			expect(result.pinned).to.equal(true);
		});

		it('should handle empty user query', () => {
			const secureMerge = createQueryWithProtection();
			const userQuery = {};
			
			const result = secureMerge('legitimate-room-id', userQuery);
			
			expect(result.rid).to.equal('legitimate-room-id');
		});

		it('should handle query without rid key', () => {
			const secureMerge = createQueryWithProtection();
			const userQuery = { text: 'search term', ts: { $gt: '2024-01-01' } };
			
			const result = secureMerge('legitimate-room-id', userQuery);
			
			expect(result.rid).to.equal('legitimate-room-id');
			expect(result.text).to.equal('search term');
			expect(result.ts).to.deep.equal({ $gt: '2024-01-01' });
		});
	});

	describe('Vulnerable query merge pattern (for comparison)', () => {
		it('should show the vulnerability - user rid can override server rid', () => {
			const vulnerableMerge = createVulnerableQuery();
			const userQuery = { rid: 'malicious-room-id', text: 'hello' };
			
			const result = vulnerableMerge('legitimate-room-id', userQuery);
			
			// In the vulnerable pattern, the last value wins
			// This demonstrates why the fix is necessary
			expect(result.rid).to.equal('malicious-room-id');
		});
	});
});
