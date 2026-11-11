import { join } from 'node:path';

import { selectionFrames, selectionStates } from './lib/selectionPalettes.mts';
import type { SelectionControl } from './lib/selectionPalettes.mts';
import type { Target } from './lib/target.mts';
import { toCSSValue } from '../../src/helpers/toCSSValue.ts';
import { borderRadius, size } from '../../src/styleTokens.ts';

const control: SelectionControl = {
	name: 'check-box',
	prefix: 'checkBox',
	unchecked: 'empty',
	focusRaised: true,
	checked: [':indeterminate', ':checked'],
	radius: toCSSValue('--rcx-check-box-border-radius', toCSSValue('--rcx-border-radius-small', borderRadius('small'))),
	fake: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: size('x20')! },
};

const rem = (value: number) => `${Number(value.toFixed(4))}rem`;

// The mark is the fake's `::before` and `::after`: a dash when indeterminate, two strokes of a tick when checked
const marks = () => {
	const box = Number.parseFloat(size('x20')!);
	const length = 0.6 * box;
	const thickness = 2 / 16;
	const smoothness = 1 / 16;
	const shift = `translate(${rem(-length / 3)}, ${rem(length / 6)}) rotate(-45deg)`;

	return `.rcx-check-box__fake::before,
.rcx-check-box__fake::after {
	position: absolute;

	display: block;
	visibility: hidden;

	content: '';

	opacity: 0;
	background-color: currentColor;
}

.rcx-check-box__input:indeterminate + .rcx-check-box__fake::before {
	visibility: visible;

	width: ${rem(length)};
	height: ${rem(thickness)};

	opacity: 1;
	border-radius: ${rem(smoothness)};
}

.rcx-check-box__input:checked + .rcx-check-box__fake::before,
.rcx-check-box__input:checked + .rcx-check-box__fake::after {
	visibility: visible;

	opacity: 1;
	border-radius: ${rem(smoothness)};
}

.rcx-check-box__input:checked + .rcx-check-box__fake::before {
	width: ${rem(length)};
	height: ${rem(thickness)};

	transform: ${shift} translate(${rem(length / 2)}, ${rem(length / 6)});
}

.rcx-check-box__input:checked + .rcx-check-box__fake::after {
	width: ${rem(thickness)};
	height: ${rem(length / 2)};

	transform: ${shift};
}`;
};

const component = join(import.meta.dirname, '../../src/components/CheckBox');

const targets: Target[] = [
	{ file: join(component, 'CheckBox.tsx'), generate: () => selectionFrames(control) },
	{ file: join(component, 'CheckBox.styles.css'), generate: () => `${marks()}\n\n${selectionStates(control)}`, css: true },
];

export default targets;
