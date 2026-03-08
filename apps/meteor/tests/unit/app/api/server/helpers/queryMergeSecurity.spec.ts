import { expect } from 'chai';

describe('Query merge security - rid protection', () => {
	// The secure pattern used in the fix: filter out rid from user query before merging
	const createSecureMerge = () => {
		return (serverRid: string, userQuery: Record<string, unknown>) => ({
			rid: serverRid,
			...Object.fromEntries(
				Object.entries(userQuery).filter(([key]) => key !== 'rid'),
			),
		});
	};

	// The vulnerable pattern: spread user query AFTER server rid (allows override)
	const createVulnerableMerge = () => {
		return (serverRid: string, userQuery: Record<string, unknown>) => ({
			rid: serverRid,
			...userQuery, // User query can override server rid here!
		});
	};

	describe('Secure merge pattern (FIXED)', () => {
		it('should enforce server rid and filter out user-provided rid', () => {
			const merge = createSecureMerge();
			const userQuery = { rid: 'malicious-room', text: 'hello' };
			
			const result = merge('legitimate-room', userQuery);
			
			// Server rid should be preserved
			expect(result.rid).to.equal('legitimate-room');
			// Other query params should be preserved
			expect(result.text).to.equal('hello');
		});

		it('should allow other query parameters while protecting rid', () => {
			const merge = createSecureMerge();
			const userQuery = { 
				rid: 'malicious-room', 
				'starred._id': { $in: ['user1'] },
				pinned: true,
			};
			
			const result = merge('legitimate-room', userQuery);
			
			expect(result.rid).to.equal('legitimate-room');
			expect(result['starred._id']).to.deep.equal({ $in: ['user1'] });
			expect(result.pinned).to.equal(true);
		});

		it('should handle query without rid key', () => {
			const merge = createSecureMerge();
			const userQuery = { text: 'search', ts: { $gt: '2024-01-01' } };
			
			const result = merge('legitimate-room', userQuery);
			
			expect(result.rid).to.equal('legitimate-room');
			expect(result.text).to.equal('search');
		});

		it('should handle empty user query', () => {
			const merge = createSecureMerge();
			const result = merge('legitimate-room', {});
			
			expect(result.rid).to.equal('legitimate-room');
		});
	});

	describe('Vulnerable merge pattern (BEFORE FIX)', () => {
		it('demonstrates vulnerability: user-provided rid overrides server rid', () => {
			const merge = createVulnerableMerge();
			const userQuery = { rid: 'malicious-room', text: 'hello' };
			
			const result = merge('legitimate-room', userQuery);
			
			// In vulnerable pattern, user query wins due to spread order
			expect(result.rid).to.equal('malicious-room');
		});

		it('demonstrates how Object.assign order matters', () => {
			// Using Object.assign with user query second allows override
			const serverRid = 'legitimate-room';
			const userQuery = { rid: 'malicious-room', text: 'hello' };
			
			// This is SAFE: server rid set after user query
			const safeResult = Object.assign({}, userQuery, { rid: serverRid });
			expect(safeResult.rid).to.equal('legitimate-room');
			
			// This is VULNERABLE: user query set after server rid
			const vulnerableResult = Object.assign({ rid: serverRid }, userQuery);
			expect(vulnerableResult.rid).to.equal('malicious-room');
		});
	});
});
