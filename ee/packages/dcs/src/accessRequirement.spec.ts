import type { SecurityCategory } from '@rocket.chat/core-typings';

import { canAccess } from './accessControl';
import { accessRequirement, meetsRequirement, readerAccess } from './accessRequirement';
import {
	ATOMAL,
	CONFIDENTIAL,
	CRYPTO,
	EXERCISE,
	KFOR,
	OPERATION,
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

const categories = [ATOMAL, CRYPTO, REL_GBR, REL_USA, REL_FRA, EXERCISE, OPERATION, KFOR, ORCON];
const classifications = [UNCLASSIFIED, RESTRICTED, CONFIDENTIAL, SECRET, TOP_SECRET];

// Every subset of `items` whose bit is set in `mask`, for each mask below 2^items.length.
const subsets = <T>(items: T[]): T[][] =>
	Array.from({ length: 2 ** items.length }, (_, mask) => items.filter((_item, bit) => mask & (1 << bit)));

describe('accessRequirement', () => {
	it('splits restrictive keys from permissive groups and ignores informative categories', () => {
		expect(accessRequirement(exercisePolicy, label(SECRET, ATOMAL, REL_GBR, REL_USA, KFOR, ORCON))).toEqual({
			policyId: '2.999.1',
			classification: SECRET,
			required: ['2.999.1.1|restrictive|1'],
			anyOf: [{ keys: ['2.999.1.2|permissive|826', '2.999.1.2|permissive|840'] }, { keys: ['2.999.1.4|permissive|1'] }],
		});
	});

	it('requires a category the policy does not define as an exact key', () => {
		const unknown: SecurityCategory = { tagSetId: '2.999.1.2', tagType: 'permissive', lacv: '124' };
		expect(accessRequirement(exercisePolicy, label(SECRET, unknown)).required).toEqual(['2.999.1.2|permissive|124']);
	});
});

describe('meetsRequirement', () => {
	it('agrees with canAccess on every label and clearance built from the fixture policy', () => {
		const labels = subsets([ATOMAL, CRYPTO, REL_GBR, REL_USA, EXERCISE, KFOR, ORCON]).flatMap((cats) =>
			[CONFIDENTIAL, SECRET].map((classification) => label(classification, ...cats)),
		);
		const clearances = subsets(categories.slice(0, 8)).flatMap((cats) =>
			[[SECRET], [CONFIDENTIAL, SECRET], classifications].map((classes) => clearance(classes, ...cats)),
		);

		let checked = 0;
		for (const someLabel of labels) {
			const requirement = accessRequirement(exercisePolicy, someLabel);
			for (const someClearance of clearances) {
				expect(meetsRequirement(requirement, readerAccess([someClearance]))).toBe(canAccess(exercisePolicy, someLabel, someClearance));
				checked++;
			}
		}
		expect(checked).toBeGreaterThan(100000);
	});

	it('denies readers with no clearance, or a clearance under another policy', () => {
		const requirement = accessRequirement(exercisePolicy, label(UNCLASSIFIED));
		expect(meetsRequirement(requirement, readerAccess(undefined))).toBe(false);
		expect(meetsRequirement(requirement, readerAccess([{ ...clearance([UNCLASSIFIED]), policyId: '2.999.2' }]))).toBe(false);
		expect(
			meetsRequirement(requirement, readerAccess([{ ...clearance([UNCLASSIFIED]), policyId: '2.999.2' }, clearance([UNCLASSIFIED])])),
		).toBe(true);
	});
});
