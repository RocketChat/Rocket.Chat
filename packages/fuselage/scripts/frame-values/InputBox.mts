import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import {
	inputAddonStates,
	inputBoxStates,
	inputPalettes,
	inputTextFillStates,
	inputTextStates,
	selectorsFor,
	type Condition,
} from './lib/inputPalettes.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { colors, offScale } from './lib/tokens.mts';
import { borderRadius, borderWidth, size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/InputBox', file);

const radius = () => themed('input-border-radius', themed('border-radius-medium', borderRadius('medium')));

// The padding of a bordered box leaves room for its border: 16px less the 1px of the border
const paddingInline = offScale(16 - 1);

const generateInput = () => {
	const frame = {
		render: 'input',
		position: 'relative',
		display: 'inline-flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexGrow: 1,
		flexShrink: 0,
		flexBasis: 'auto',
		width: size('none')!,
		minWidth: size('x128')!,
		minHeight: 'auto',
		userSelect: 'auto',
		verticalAlign: 'baseline',
		whiteSpace: 'nowrap',
		wordBreak: 'break-all',
		outlineStyle: 'none',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		...font('p2m'),
	};

	const decorated = {
		minWidth: size('x128')!,
		minHeight: size('x40')!,
		paddingBlock: spacing('x8')!,
		paddingInline,
		borderWidth: borderWidth('default'),
		borderStyle: 'solid',
		borderRadius: radius(),
	};

	const small = { ...font('c1') };

	// Every shape is one key, so a property has a single owner: a small bordered box wins over a bordered one
	const shapes = {
		'plain': {},
		'plain-small': small,
		decorated,
		'decorated-small': {
			...small,
			minWidth: size('x112')!,
			minHeight: size('x28')!,
			paddingBlock: spacing('x4')!,
			paddingInline: spacing('x8')!,
			borderWidth: borderWidth('default'),
			borderStyle: 'solid',
			borderRadius: radius(),
		},
		// Inside the wrapper, which draws the box and sizes the input by the room it leaves
		'wrapped': { width: size('none')!, minWidth: size('none')! },
		'wrapped-small': { ...small, width: size('none')!, minWidth: size('none')! },
	};

	const textarea = { overflow: 'auto', resize: 'none', verticalAlign: 'middle', whiteSpace: 'normal' };
	const hidden = { display: 'none' };
	const invisible = { visibility: 'hidden', opacity: 0 };

	return [
		`const inputFrame = ${literal(frame)} as const;`,
		`const inputShapes = ${literal(shapes)} as const;`,
		`const inputTextArea = ${literal(textarea)} as const;`,
		`const inputHidden = ${literal(hidden)} as const;`,
		`const inputInvisible = ${literal(invisible)} as const;`,
	].join('\n\n');
};

const generateWrapper = () => {
	const frame = {
		render: 'label',
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'center',
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 'auto',
		minWidth: size('x144')!,
		minHeight: size('x40')!,
		paddingBlock: spacing('x8')!,
		paddingInline,
		gap: spacing('x8')!,
		verticalAlign: 'baseline',
		wordBreak: 'break-all',
		outlineStyle: 'none',
		borderWidth: borderWidth('default'),
		borderStyle: 'solid',
		borderRadius: radius(),
		...font('p2m'),
	};

	// A small wrapper is a fixed height, and wins over the end-addon-flush padding and the textarea's top alignment
	const layouts = {
		'input': {},
		'input-flush': { paddingBlock: spacing('x4')!, paddingInlineEnd: spacing('x4')! },
		'textarea': { alignItems: 'flex-start' },
		'textarea-flush': { alignItems: 'flex-start', paddingBlock: spacing('x4')!, paddingInlineEnd: spacing('x4')! },
		'small': {
			alignItems: 'center',
			minWidth: size('x112')!,
			minHeight: size('x28')!,
			maxHeight: size('x28')!,
			paddingBlock: spacing('x4')!,
			paddingInline: spacing('x8')!,
		},
	};

	return [
		`const inputBoxWrapperFrame = ${literal(frame)} as const;`,
		`const inputBoxWrapperLayouts = ${literal(layouts)} as const;`,
		`const inputBoxWrapperHidden = ${literal({ display: 'none' })} as const;`,
		`const inputBoxWrapperInvisible = ${literal({ visibility: 'hidden', opacity: 0 })} as const;`,
	].join('\n\n');
};

const generateAddon = () => {
	const frame = {
		render: 'span',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'flex-start',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		minWidth: 'auto',
		minHeight: 'auto',
		cursor: 'pointer',
		outlineStyle: 'none',
	};

	return `const inputBoxAddonFrame = ${literal(frame)} as const;`;
};

const generateSkeleton = () => {
	const frame = {
		render: 'div',
		display: 'inline-flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexGrow: 1,
		flexShrink: 0,
		flexBasis: size('none')!,
		minWidth: size('x128')!,
		minHeight: size('x40')!,
		paddingBlock: offScale(12 - 1),
		paddingInline,
		verticalAlign: 'baseline',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		borderWidth: borderWidth('default'),
		borderStyle: 'solid',
		borderRadius: radius(),
		...font('p2m'),
	};

	return `const inputBoxSkeletonFrame = ${literal(frame)} as const;`;
};

const block = (selectors: string[], declarations: Record<string, string>) =>
	`${[...new Set(selectors)].join(',\n')} {\n${Object.entries(declarations)
		.map(([property, value]) => `\t${property}: ${value};`)
		.join('\n')}\n}`;

const input = '.rcx-input-box';
const decorated = `${input}:not(.rcx-input-box--undecorated)`;
const wrapper = '.rcx-input-box__wrapper';

const disabled: Condition[] = [{ ancestor: '*:disabled ' }, { suffix: ':disabled' }];

// What follows a native control, or the wrapper that holds it
const wrapperConditions = {
	invalid: [{ suffix: ':has(> .rcx-input-box:invalid)' }],
	disabled: [{ ancestor: '*:disabled ' }, { suffix: ':has(> .rcx-input-box:disabled)' }],
};

const generateCss = () => {
	const { default: palette } = inputPalettes();
	const thumb = (alpha: number) => {
		const hex = colors.n100.replace('#', '');
		const [red, green, blue] = [0, 2, 4].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
		return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
	};
	const dateTime = ['date', 'time'].map((type) => `${input}.rcx-input-box--type-${type}`);

	return [
		'/* State of a native form control: the border, background, text, caret and addon colours follow :invalid, :disabled, a disabled fieldset and the input of a wrapper */',
		inputBoxStates({ element: decorated }),
		block([wrapper], { color: textIconColor('font-default'), cursor: 'default' }),
		inputBoxStates({ element: wrapper, conditions: wrapperConditions }),
		block(selectorsFor(wrapper, wrapperConditions.disabled), { 'cursor': 'not-allowed', 'pointer-events': 'none' }),
		block([input], { 'background-color': 'transparent' }),
		inputTextStates({ element: input, placeholderVisible: '.rcx-input-box--placeholder-visible' }),
		block(selectorsFor(input, disabled), { cursor: 'not-allowed' }),
		inputAddonStates({ element: input, addon: '.rcx-input-box__addon' }),
		// The addon of a select that follows its filter input is not an input box part, and follows it the same way
		inputAddonStates({ element: input, addon: '.rcx-select__addon' }),
		block(
			[
				...selectorsFor(input, disabled).map((selector) => `${selector} + .rcx-input-box__addon`),
				...selectorsFor(input, disabled).map((selector) => `${selector} + .rcx-select__addon`),
			],
			{ 'pointer-events': 'none' },
		),
		'/* Not a frame: the part of a date, time or number input the browser draws */',
		...dateTime.map((element) => inputTextFillStates({ element })),
		block(
			['date', 'time'].flatMap((type) => [
				`${input}.rcx-input-box--type-${type}::-webkit-inner-spin-button`,
				`${input}.rcx-input-box--type-${type}::-webkit-calendar-picker-indicator`,
			]),
			{
				position: 'absolute',
				inset: '0',
				width: 'auto',
				height: 'auto',
				cursor: 'pointer',
				color: 'transparent',
				background: 'transparent',
			},
		),
		// Browsers pad the date and time fields vertically, which makes the input taller than its line height
		block(
			['date', 'time', 'datetime-local'].flatMap((type) =>
				[
					'',
					'-fields-wrapper',
					'-year-field',
					'-month-field',
					'-day-field',
					'-hour-field',
					'-minute-field',
					'-second-field',
					'-millisecond-field',
					'-meridiem-field',
				].map((part) => `${input}.rcx-input-box--type-${type}::-webkit-datetime-edit${part}`),
			),
			{ 'padding-block': '0' },
		),
		'/* Not a frame: the scrollbar of a textarea */',
		block([`${input}.rcx-input-box--type-textarea::-webkit-scrollbar`], { width: size('x4')!, height: size('x4')! }),
		block([`${input}.rcx-input-box--type-textarea::-webkit-scrollbar-track`], { 'background-color': 'transparent' }),
		block([`${input}.rcx-input-box--type-textarea::-webkit-scrollbar-thumb`], { 'background-color': thumb(0.05) }),
		block([`${input}.rcx-input-box--type-textarea:hover::-webkit-scrollbar-thumb`], { 'background-color': thumb(0.15) }),
		'/* The colours of a skeleton that stands in for an input box */',
		block(['.rcx-skeleton__input'], {
			'color': palette.color,
			'border-color': palette.border,
			'background-color': palette.background,
		}),
	].join('\n\n');
};

export default [
	{ file: component('Input.tsx'), generate: generateInput },
	{ file: component('InputBoxWrapper.tsx'), generate: generateWrapper },
	{ file: component('InputBoxAddon.tsx'), generate: generateAddon },
	{ file: component('InputBoxSkeleton.tsx'), generate: generateSkeleton },
	{ file: component('InputBox.styles.css'), generate: generateCss, css: true },
] satisfies Target[];
