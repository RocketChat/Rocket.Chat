import { canAccess, clearanceForPolicy } from './accessControl';
import {
	ATOMAL,
	CONFIDENTIAL,
	CRYPTO,
	EXERCISE,
	ORCON,
	OPERATION,
	REL_FRA,
	REL_GBR,
	REL_USA,
	SECRET,
	UNCLASSIFIED,
	clearance,
	exercisePolicy,
	label,
} from './fixtures/exercisePolicy';

describe('canAccess', () => {
	it('requires the label classification to be in the clearance', () => {
		expect(canAccess(exercisePolicy, label(CONFIDENTIAL), clearance([UNCLASSIFIED, CONFIDENTIAL]))).toBe(true);
		expect(canAccess(exercisePolicy, label(SECRET), clearance([UNCLASSIFIED, CONFIDENTIAL]))).toBe(false);
	});

	it('treats classifications as a list, not a ceiling', () => {
		expect(canAccess(exercisePolicy, label(UNCLASSIFIED), clearance([SECRET]))).toBe(false);
	});

	it('requires every restrictive category of the label', () => {
		expect(canAccess(exercisePolicy, label(SECRET, ATOMAL, CRYPTO), clearance([SECRET], ATOMAL, CRYPTO))).toBe(true);
		expect(canAccess(exercisePolicy, label(SECRET, ATOMAL, CRYPTO), clearance([SECRET], ATOMAL))).toBe(false);
	});

	it('requires one value of each permissive tag the label uses', () => {
		const releasable = label(SECRET, REL_GBR, REL_USA);
		expect(canAccess(exercisePolicy, releasable, clearance([SECRET], REL_USA))).toBe(true);
		expect(canAccess(exercisePolicy, releasable, clearance([SECRET], REL_FRA))).toBe(false);
	});

	it('evaluates each permissive tag on its own', () => {
		const both = label(SECRET, REL_GBR, EXERCISE);
		expect(canAccess(exercisePolicy, both, clearance([SECRET], REL_GBR, EXERCISE))).toBe(true);
		expect(canAccess(exercisePolicy, both, clearance([SECRET], REL_GBR, OPERATION))).toBe(false);
	});

	it('ignores informative categories', () => {
		expect(canAccess(exercisePolicy, label(SECRET, REL_GBR, ORCON), clearance([SECRET], REL_GBR))).toBe(true);
	});

	it('denies categories the policy does not define', () => {
		const unknown = { tagSetId: '2.999.1.2', tagType: 'permissive', lacv: '124' } as const;
		expect(canAccess(exercisePolicy, label(SECRET, unknown), clearance([SECRET], unknown))).toBe(false);
	});

	it('denies a category held under another tag type', () => {
		const restrictiveGbr = { ...REL_GBR, tagType: 'restrictive' } as const;
		expect(canAccess(exercisePolicy, label(SECRET, REL_GBR), clearance([SECRET], restrictiveGbr))).toBe(false);
	});

	it('denies labels and clearances of another policy', () => {
		expect(canAccess(exercisePolicy, { ...label(SECRET), policyId: '2.999.2' }, clearance([SECRET]))).toBe(false);
		expect(canAccess(exercisePolicy, label(SECRET), { ...clearance([SECRET]), policyId: '2.999.2' })).toBe(false);
	});
});

describe('clearanceForPolicy', () => {
	it('picks the clearance matching the policy', () => {
		const other = { ...clearance([SECRET]), policyId: '2.999.2' };
		const mine = clearance([CONFIDENTIAL]);
		expect(clearanceForPolicy([other, mine], '2.999.1')).toBe(mine);
		expect(clearanceForPolicy(undefined, '2.999.1')).toBeUndefined();
	});
});
