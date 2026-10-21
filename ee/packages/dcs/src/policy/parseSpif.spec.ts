import { SpifError } from '../errors';
import { parseSpif } from './parseSpif';
import { categoryKey } from './types';
import {
	ATOMAL,
	CRYPTO,
	KFOR,
	exercisePolicy,
	exerciseSpif,
	REL_FRA,
	REL_GBR,
	REL_USA,
	UNCLASSIFIED,
	RESTRICTED,
} from '../fixtures/exercisePolicy';

const spif = (body: string, policy = '<spif:securityPolicyId name="P" id="2.999.9"/>') =>
	`<spif:SPIF xmlns:spif="http://www.xmlspif.org/spif">${policy}<spif:securityClassifications>${body}</spif:securityClassifications></spif:SPIF>`;

describe('parseSpif', () => {
	it('reads the policy identity and classifications in declaration order', () => {
		expect(exercisePolicy).toMatchObject({ id: '2.999.1', name: 'EXERCISE', version: '3' });
		expect(exercisePolicy.classifications.map(({ name }) => name)).toEqual([
			'UNMARKED',
			'UNCLASSIFIED',
			'RESTRICTED',
			'CONFIDENTIAL',
			'SECRET',
			'TOP SECRET',
		]);
		expect(exercisePolicy.classificationsByLacv.get(4)).toMatchObject({ name: 'SECRET', hierarchy: 4, color: 'red', obsolete: false });
		expect(exercisePolicy.classificationsByLacv.get(0)?.obsolete).toBe(true);
	});

	it('maps SPIF tag types to label category types', () => {
		const tagTypes = exercisePolicy.tagSets.flatMap(({ tags }) => tags.map(({ name, tagType }) => [name, tagType]));
		expect(tagTypes).toEqual([
			['Additional Sensitivity', 'restrictive'],
			['Releasable To', 'permissive'],
			['Special Category', 'enumeratedPermissive'],
			['Handling', 'informative'],
			['Context', 'permissive'],
		]);
		expect(exercisePolicy.tagSets[2].tags[0].singleSelection).toBe(true);
	});

	it('resolves excluded classifications to their lacv', () => {
		expect(exercisePolicy.categoriesByKey.get(categoryKey(ATOMAL))?.excludedClassifications).toEqual([UNCLASSIFIED, RESTRICTED]);
	});

	it('resolves category references by tag set name, by tag set id and for a whole tag', () => {
		expect(exercisePolicy.categoriesByKey.get(categoryKey(CRYPTO))?.requiredCategories).toEqual([
			{ operation: 'all', categoryGroups: [[REL_GBR]] },
		]);
		expect(exercisePolicy.classificationsByLacv.get(4)?.requiredCategories).toEqual([
			{ operation: 'oneOrMore', categoryGroups: [[REL_GBR, REL_USA, REL_FRA]] },
		]);
		const exercise = exercisePolicy.tagSets[2].tags[0].categories[0];
		expect(exercise.excludedCategories.map(({ lacv }) => lacv)).toEqual(['1', '2', '9']);
		const operation = exercisePolicy.tagSets[2].tags[0].categories[1];
		expect(operation.requiredCategories).toEqual([{ operation: 'onlyOne', categoryGroups: [[REL_GBR, REL_USA, REL_FRA], [KFOR]] }]);
	});

	it('groups markings by language and keeps locationless phrases unrestricted', () => {
		const markings = exercisePolicy.classificationsByLacv.get(5)?.markings;
		expect(markings?.get('')?.phrases).toEqual([
			{ phrase: 'COSMIC', noMarkingDisplay: false, noNameDisplay: false, suppressClassName: false, replacePolicy: true },
		]);
		expect(markings?.get('fr')?.phrases).toEqual([
			expect.objectContaining({ phrase: 'TRES SECRET', locations: ['pageTop', 'pageBottom'] }),
		]);
		expect(exercisePolicy.tagSets[1].tags[0].markings.get('')).toMatchObject({ prefix: 'REL TO ', separator: ', ' });
	});

	it('parses the fixture deterministically', () => {
		expect(parseSpif(exerciseSpif)).toEqual(exercisePolicy);
	});

	it.each([
		['malformed XML', '<spif:SPIF xmlns:spif="http://www.xmlspif.org/spif">'],
		['a root outside the SPIF namespace', '<SPIF><securityPolicyId name="P" id="1"/></SPIF>'],
		['a DOCTYPE', `<!DOCTYPE x [<!ENTITY e "boom">]>${spif('<spif:securityClassification name="A" lacv="1" hierarchy="1"/>')}`],
		['no securityPolicyId', spif('<spif:securityClassification name="A" lacv="1" hierarchy="1"/>', '')],
		['no classification', spif('')],
		['a non-integer lacv', spif('<spif:securityClassification name="A" lacv="x" hierarchy="1"/>')],
		[
			'a duplicate classification lacv',
			spif('<spif:securityClassification name="A" lacv="1" hierarchy="1"/><spif:securityClassification name="B" lacv="1" hierarchy="2"/>'),
		],
		[
			'an unknown marking code',
			spif(
				'<spif:securityClassification name="A" lacv="1" hierarchy="1"><spif:markingData><spif:code>sideways</spif:code></spif:markingData></spif:securityClassification>',
			),
		],
		[
			'a reference to an unknown tag set',
			spif(
				'<spif:securityClassification name="A" lacv="1" hierarchy="1"><spif:requiredCategory operation="all"><spif:categoryGroup tagSetRef="Nope" tagType="permissive" lacv="1"/></spif:requiredCategory></spif:securityClassification>',
			),
		],
		['an unknown excluded classification', exerciseSpif.replace('<spif:excludedClass>RESTRICTED', '<spif:excludedClass>MYSTERY')],
		['a duplicate excluded classification', exerciseSpif.replace('<spif:excludedClass>RESTRICTED', '<spif:excludedClass>UNCLASSIFIED')],
		['a duplicate category', exerciseSpif.replace('name="USA" lacv="840"', 'name="USA" lacv="826"')],
	])('rejects %s', (_, xml) => {
		expect(() => parseSpif(xml)).toThrow(SpifError);
	});
});
