import { buildCatalog, defaultCatalogEntries } from './catalog';
import {
	ATOMAL,
	CONFIDENTIAL,
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

describe('defaultCatalogEntries', () => {
	it('offers each classification in use, uncategorized and in hierarchy order', () => {
		expect(defaultCatalogEntries(exercisePolicy).map(({ label }) => label.classification)).toEqual([
			UNCLASSIFIED,
			RESTRICTED,
			CONFIDENTIAL,
			SECRET,
			TOP_SECRET,
		]);
	});
});

describe('buildCatalog', () => {
	const entries = [
		...defaultCatalogEntries(exercisePolicy),
		{ label: label(SECRET, REL_GBR), selector: 'Classified|SECRET REL GBR' },
		{ label: label(SECRET, REL_USA) },
		{ label: label(SECRET, ATOMAL, REL_GBR) },
	];

	it('keeps only valid labels that every clearance covers', () => {
		const sender = clearance([UNCLASSIFIED, CONFIDENTIAL, SECRET], REL_GBR, ATOMAL);
		const room = clearance([UNCLASSIFIED, SECRET], REL_GBR, REL_USA);

		expect(buildCatalog(exercisePolicy, entries, [sender, room]).map(({ selector }) => selector)).toEqual([
			'EXERCISE UNCLASSIFIED',
			'Classified|SECRET REL GBR',
		]);
	});

	it('flags the default label regardless of category order', () => {
		const items = buildCatalog(exercisePolicy, [{ label: label(SECRET, REL_GBR, REL_USA) }], [clearance([SECRET], REL_USA)], {
			defaultLabel: label(SECRET, REL_USA, REL_GBR),
		});
		expect(items).toEqual([
			{
				selector: 'EXERCISE SECRET REL TO GBR, USA',
				default: true,
				label: label(SECRET, REL_GBR, REL_USA),
				marking: { text: 'EXERCISE SECRET REL TO GBR, USA', fgcolor: 'black', bgcolor: 'red' },
			},
		]);
	});

	it('offers nothing to someone without a clearance under the policy', () => {
		expect(buildCatalog(exercisePolicy, entries, [{ ...clearance([UNCLASSIFIED]), policyId: '2.999.2' }])).toEqual([]);
	});
});
