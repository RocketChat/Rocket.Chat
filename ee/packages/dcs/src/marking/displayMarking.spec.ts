import { readableTextColor } from './colors';
import { displayMarking } from './displayMarking';
import {
	ATOMAL,
	CRYPTO,
	EXERCISE,
	KFOR,
	ORCON,
	REL_GBR,
	REL_USA,
	SECRET,
	TOP_SECRET,
	UNCLASSIFIED,
	exercisePolicy,
	label,
} from '../fixtures/exercisePolicy';

describe('displayMarking', () => {
	it('renders policy, classification and the classification color', () => {
		expect(displayMarking(exercisePolicy, label(UNCLASSIFIED))).toEqual({
			text: 'EXERCISE UNCLASSIFIED',
			fgcolor: 'white',
			bgcolor: 'green',
		});
	});

	it('groups categories by tag with the tag qualifiers, in SPIF order', () => {
		const marking = displayMarking(exercisePolicy, label(SECRET, REL_USA, CRYPTO, REL_GBR, ATOMAL));
		expect(marking).toEqual({ text: 'EXERCISE SECRET ATOMAL CRYPTO REL TO GBR, USA', fgcolor: 'black', bgcolor: 'red' });
	});

	it('uses category phrases and the default tag separator', () => {
		expect(displayMarking(exercisePolicy, label(SECRET, REL_GBR, EXERCISE, ORCON)).text).toBe(
			'EXERCISE SECRET REL TO GBR EXERCISE ORIGINATOR CONTROLLED',
		);
	});

	it('lets a classification replace the policy name', () => {
		expect(displayMarking(exercisePolicy, label(TOP_SECRET)).text).toBe('COSMIC TOP SECRET');
	});

	it('lets a category replace the policy name while hiding its own', () => {
		expect(displayMarking(exercisePolicy, label(SECRET, REL_GBR, KFOR)).text).toBe('EXERCISE/KFOR SECRET REL TO GBR');
	});

	it('renders a language, then its base language, then untagged markings', () => {
		expect(displayMarking(exercisePolicy, label(TOP_SECRET), { lang: 'fr' }).text).toBe('COSMIC TRES SECRET');
		expect(displayMarking(exercisePolicy, label(TOP_SECRET), { lang: 'fr-CA' }).text).toBe('COSMIC TRES SECRET');
		expect(displayMarking(exercisePolicy, label(UNCLASSIFIED), { lang: 'fr' }).text).toBe('EXERCISE UNCLASSIFIED');
	});

	it('only applies phrases at their locations', () => {
		expect(displayMarking(exercisePolicy, label(TOP_SECRET), { lang: 'fr', location: 'documentStart' }).text).toBe('COSMIC TOP SECRET');
	});
});

describe('readableTextColor', () => {
	it.each([
		['white', 'black'],
		['gold', 'black'],
		['navy', 'white'],
		['#FFA500', 'black'],
		['#00f', 'white'],
		['not-a-color', 'black'],
	])('picks %s text on %s', (background, expected) => {
		expect(readableTextColor(background)).toBe(expected);
	});
});
