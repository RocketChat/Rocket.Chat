import { join } from 'node:path';

import { selectionFrames, selectionStates } from './lib/selectionPalettes.mts';
import type { SelectionControl } from './lib/selectionPalettes.mts';
import type { Target } from './lib/target.mts';
import { toCSSValue } from '../../src/helpers/toCSSValue.ts';
import { borderRadius, size } from '../../src/styleTokens.ts';

const radius = toCSSValue('--rcx-border-radius-full', borderRadius('full'));

const control: SelectionControl = {
	name: 'radio-button',
	prefix: 'radioButton',
	unchecked: 'empty',
	checked: [':checked'],
	radius,
	fake: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: size('x20')! },
};

// The dot is the fake's `::before`
const dot = () => {
	const diameter = `${Number((0.3 * Number.parseFloat(size('x20')!)).toFixed(4))}rem`;

	return `.rcx-radio-button__input:checked + .rcx-radio-button__fake::before {
	display: block;

	width: ${diameter};
	height: ${diameter};

	content: '';

	border-radius: ${radius};
	background-color: currentColor;
}`;
};

const component = join(import.meta.dirname, '../../src/components/RadioButton');

const targets: Target[] = [
	{ file: join(component, 'RadioButton.tsx'), generate: () => selectionFrames(control) },
	{ file: join(component, 'RadioButton.styles.css'), generate: () => `${dot()}\n\n${selectionStates(control)}`, css: true },
];

export default targets;
