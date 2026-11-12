import { join } from 'node:path';

import { buttonFont } from './lib/buttonPalettes.mts';
import { selectionFrames, selectionStates } from './lib/selectionPalettes.mts';
import type { SelectionControl } from './lib/selectionPalettes.mts';
import type { Target } from './lib/target.mts';
import { toCSSValue } from '../../src/helpers/toCSSValue.ts';
import { borderRadius, borderWidth, inset, size } from '../../src/styleTokens.ts';

const radius = toCSSValue('--rcx-toggle-switch-border-radius', toCSSValue('--rcx-border-radius-full', borderRadius('full')));

const control: SelectionControl = {
	name: 'toggle-switch',
	prefix: 'toggleSwitch',
	unchecked: 'off',
	checked: [':checked'],
	radius,
	fake: { display: 'block', width: size('x36')!, height: `calc(${size('x20')} - 2 * ${borderWidth('default')})` },
};

const knobSize = `calc(${size('x16')} - 2 * ${borderWidth('default')})`;

// The knob is the fake's `::before`: it slides to the end when checked, and is not dimmed when disabled
const knob = () => `.rcx-toggle-switch__input + .rcx-toggle-switch__fake::before {
	position: absolute;
	top: 50%;
	inset-inline-start: ${inset('x1')};

	width: ${knobSize};
	height: ${knobSize};

	content: '';
	transform: translateY(-50%);

	border-radius: ${radius};
	background-color: ${buttonFont('primary')};
}

.rcx-toggle-switch__input:disabled + .rcx-toggle-switch__fake::before {
	background-color: ${buttonFont('secondary-disabled')};
}

.rcx-toggle-switch__input:checked + .rcx-toggle-switch__fake::before {
	inset-inline-start: calc(100% - (${size('x16')} - ${borderWidth('default')}));

	background-color: ${buttonFont('primary')};
}`;

const component = join(import.meta.dirname, '../../src/components/ToggleSwitch');

const targets: Target[] = [
	{ file: join(component, 'ToggleSwitch.tsx'), generate: () => selectionFrames(control) },
	{ file: join(component, 'ToggleSwitch.styles.css'), generate: () => `${selectionStates(control)}\n\n${knob()}`, css: true },
];

export default targets;
