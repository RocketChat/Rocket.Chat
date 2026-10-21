import {
	ATOMAL,
	BOHEMIA,
	CONFIDENTIAL,
	CRYPTO,
	EXERCISE,
	KFOR,
	OPERATION,
	ORCON,
	REL_GBR,
	REL_USA,
	RESTRICTED,
	SECRET,
	UNMARKED,
	exercisePolicy,
	label,
} from './fixtures/exercisePolicy';
import { validateLabel } from './validateLabel';

const codes = (...args: Parameters<typeof label>) => validateLabel(exercisePolicy, label(...args)).map(({ code }) => code);

describe('validateLabel', () => {
	it('accepts a label that follows every rule', () => {
		expect(codes(SECRET, ATOMAL, CRYPTO, REL_GBR, REL_USA, ORCON)).toEqual([]);
		expect(codes(CONFIDENTIAL)).toEqual([]);
	});

	it('rejects another policy', () => {
		expect(validateLabel(exercisePolicy, { ...label(SECRET), policyId: '2.999.2' })).toEqual([{ code: 'policy-mismatch' }]);
	});

	it('rejects unknown and obsolete values', () => {
		expect(codes(42)).toEqual(['unknown-classification']);
		expect(codes(UNMARKED)).toEqual(['obsolete-classification']);
		expect(codes(CONFIDENTIAL, BOHEMIA)).toEqual(['obsolete-category']);
		expect(codes(CONFIDENTIAL, { ...REL_GBR, lacv: '124' })).toEqual(['unknown-category']);
	});

	it('rejects a category repeated in the label', () => {
		expect(codes(CONFIDENTIAL, REL_GBR, REL_GBR)).toEqual(['duplicate-category']);
	});

	it('rejects a category combined with an excluded classification', () => {
		expect(codes(RESTRICTED, ATOMAL)).toEqual(['excluded-classification']);
	});

	it('rejects a category combined with an excluded category', () => {
		const violations = validateLabel(exercisePolicy, label(CONFIDENTIAL, ATOMAL, EXERCISE));
		expect(violations).toEqual([{ code: 'excluded-category', category: EXERCISE, excluded: ATOMAL }]);
	});

	it('rejects several values of a single-selection tag', () => {
		expect(codes(CONFIDENTIAL, EXERCISE, OPERATION, REL_GBR)).toEqual(['single-selection']);
	});

	it('enforces categories a classification requires', () => {
		expect(codes(SECRET)).toEqual(['required-category']);
		expect(codes(SECRET, REL_USA)).toEqual([]);
	});

	it('counts required category groups, not the categories inside them', () => {
		expect(codes(CONFIDENTIAL, OPERATION, REL_GBR, REL_USA)).toEqual([]);
		expect(codes(CONFIDENTIAL, OPERATION, REL_GBR, KFOR)).toEqual(['required-category']);
		expect(codes(CONFIDENTIAL, OPERATION)).toEqual(['required-category']);
	});

	it('enforces categories a category requires', () => {
		const violations = validateLabel(exercisePolicy, label(CONFIDENTIAL, CRYPTO, REL_USA));
		expect(violations).toEqual([
			{ code: 'required-category', requiredBy: CRYPTO, requirement: { operation: 'all', categoryGroups: [[REL_GBR]] } },
		]);
	});
});
