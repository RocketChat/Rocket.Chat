import { canAccess } from './accessControl';
import { dominates } from './dominance';
import {
	ATOMAL,
	CONFIDENTIAL,
	CRYPTO,
	EXERCISE,
	KFOR,
	ORCON,
	REL_FRA,
	REL_GBR,
	REL_USA,
	RESTRICTED,
	SECRET,
	TOP_SECRET,
	UNCLASSIFIED,
	clearance,
	exercisePolicy,
	label,
} from './fixtures/exercisePolicy';

const subsets = <T>(items: T[]): T[][] =>
	Array.from({ length: 2 ** items.length }, (_, mask) => items.filter((_item, bit) => mask & (1 << bit)));

const ladder = [UNCLASSIFIED, RESTRICTED, CONFIDENTIAL, SECRET, TOP_SECRET];

describe('dominates', () => {
	it('accepts a higher classification and refuses a lower one', () => {
		expect(dominates(exercisePolicy, label(SECRET), label(CONFIDENTIAL))).toBe(true);
		expect(dominates(exercisePolicy, label(CONFIDENTIAL), label(CONFIDENTIAL))).toBe(true);
		expect(dominates(exercisePolicy, label(CONFIDENTIAL), label(SECRET))).toBe(false);
	});

	it('requires every restrictive category of the lower label', () => {
		expect(dominates(exercisePolicy, label(SECRET, ATOMAL, CRYPTO), label(SECRET, ATOMAL))).toBe(true);
		expect(dominates(exercisePolicy, label(SECRET, ATOMAL), label(SECRET, ATOMAL, CRYPTO))).toBe(false);
	});

	it('only narrows releasability', () => {
		expect(dominates(exercisePolicy, label(SECRET, REL_GBR), label(SECRET, REL_GBR, REL_USA))).toBe(true);
		expect(dominates(exercisePolicy, label(SECRET, REL_GBR, REL_USA), label(SECRET, REL_GBR))).toBe(false);
		expect(dominates(exercisePolicy, label(SECRET), label(SECRET, REL_GBR))).toBe(false);
		expect(dominates(exercisePolicy, label(SECRET, REL_GBR), label(SECRET))).toBe(true);
	});

	it('ignores informative categories and refuses other policies', () => {
		expect(dominates(exercisePolicy, label(SECRET), label(SECRET, ORCON))).toBe(true);
		expect(dominates(exercisePolicy, { ...label(SECRET), policyId: '2.999.2' }, label(UNCLASSIFIED))).toBe(false);
	});

	it('never lets a reader see quoted content they could not read on its own', () => {
		const labels = subsets([ATOMAL, CRYPTO, REL_GBR, REL_USA, EXERCISE, KFOR]).flatMap((cats) =>
			[UNCLASSIFIED, CONFIDENTIAL, SECRET].map((classification) => label(classification, ...cats)),
		);
		// Clearances that cover every classification up to some level, as clearances are usually issued
		const clearances = subsets([ATOMAL, CRYPTO, REL_GBR, REL_USA, REL_FRA, EXERCISE, KFOR]).flatMap((cats) =>
			[1, 3, 4, 5].map((levels) => clearance(ladder.slice(0, levels), ...cats)),
		);

		let dominated = 0;
		for (const higher of labels) {
			for (const lower of labels) {
				if (!dominates(exercisePolicy, higher, lower)) continue;
				dominated++;
				for (const someClearance of clearances) {
					if (canAccess(exercisePolicy, higher, someClearance)) {
						expect(canAccess(exercisePolicy, lower, someClearance)).toBe(true);
					}
				}
			}
		}
		expect(dominated).toBeGreaterThan(1000);
	});
});
