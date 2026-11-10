import { join } from 'node:path';

import { buttonBackground, buttonFont } from './lib/buttonPalettes.mts';
import { font, statusFont, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { strokeColors, surfaceColors } from '../../src/Theme.ts';
import { borderRadius, borderWidth, spacing } from '../../src/styleTokens.ts';

const generateTag = () => {
	const kinds: Record<string, { color: string; background: string; hover: string }> = {
		'default': {
			color: buttonFont('secondary'),
			background: buttonBackground('secondary', 'default'),
			hover: buttonBackground('secondary', 'hover'),
		},
		'primary': {
			color: buttonFont('primary'),
			background: buttonBackground('primary', 'default'),
			hover: buttonBackground('primary', 'hover'),
		},
		'secondary': {
			color: buttonFont('secondary'),
			background: buttonBackground('secondary', 'default'),
			hover: buttonBackground('secondary', 'hover'),
		},
		'danger': {
			color: buttonFont('danger'),
			background: buttonBackground('danger', 'default'),
			hover: buttonBackground('danger', 'hover'),
		},
		'warning': {
			color: buttonFont('warning'),
			background: buttonBackground('warning', 'default'),
			hover: buttonBackground('warning', 'hover'),
		},
		'featured': {
			color: buttonFont('primary'),
			background: surfaceColors['surface-featured'].toString(),
			hover: surfaceColors['surface-featured-hover'].toString(),
		},
		'secondary-danger': {
			color: buttonFont('secondary-danger'),
			background: buttonBackground('secondary-danger', 'default'),
			hover: buttonBackground('secondary-danger', 'hover'),
		},
		'secondary-warning': {
			color: statusFont('warning'),
			background: buttonBackground('secondary', 'default'),
			hover: buttonBackground('secondary', 'hover'),
		},
		'secondary-info': {
			color: statusFont('info'),
			background: buttonBackground('secondary', 'default'),
			hover: buttonBackground('secondary', 'hover'),
		},
	};

	const mutedColor = themed('tag-colors-disabled-color', textIconColor('font-secondary-info'));
	const mutedBackground = themed('tag-colors-disabled-background-color', surfaceColors['surface-neutral'].toString());

	// What each property depends on decides its variant, so a key never repeats what another property already says:
	// the color on the kind and whether the tag is clickable, the background on those and whether it is disabled
	const tone: Record<string, Value> = {};
	const fill: Record<string, Value> = {};
	for (const [kind, k] of Object.entries(kinds)) {
		const color = themed(`tag-colors-${kind}-color`, k.color);
		const background = themed(`tag-colors-${kind}-background-color`, k.background);
		const hover = themed(`tag-colors-${kind}-hover-background-color`, k.hover);

		tone[`${kind}|rest`] = { color };
		tone[`${kind}|clickable`] = {
			color: {
				default: themed('link-color', color),
				focus: themed('link-focus-color', color),
				press: themed('link-active-color', color),
			},
		};

		fill[`${kind}|rest`] = { backgroundColor: background };
		fill[`${kind}|clickable`] = { backgroundColor: { default: background, hover } };
		// A disabled tag that is clickable keeps its hover and its link color
		fill[`${kind}|clickable-disabled`] = { backgroundColor: { default: mutedBackground, hover } };
	}
	// A disabled tag that isn't clickable has one look whatever its kind
	tone.muted = { color: mutedColor };
	fill.muted = { backgroundColor: mutedBackground };

	const mediumRadius = themed('border-radius-medium', borderRadius('medium'));
	const focusRing = `0 0 0 ${borderWidth('medium')} ${strokeColors['stroke-extra-light-highlight'].toString()}`;

	// `display` is left to the `flow` variant
	const frame = {
		render: 'span',
		flexDirection: 'row',
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		minWidth: 'auto',
		minHeight: 'auto',
		overflow: 'hidden',
		paddingBlock: offScale(2),
		paddingInline: spacing('x4'),
		gap: spacing('x4'),
		whiteSpace: 'nowrap',
		textDecoration: 'none',
		textOverflow: 'ellipsis',
		wordBreak: 'keep-all',
		outlineStyle: 'none',
		borderWidth: borderWidth('default'),
		borderStyle: 'solid',
		borderColor: { 'default': 'transparent', 'focus-visible': strokeColors['stroke-highlight'].toString() },
		boxShadow: { 'focus-visible': focusRing },
	};

	const shape = {
		regular: {
			borderRadius: {
				'default': themed('tag-border-radius', themed('border-radius-small', borderRadius('small'))),
				'focus-visible': mediumRadius,
			},
		},
		pill: { borderRadius: { 'default': themed('border-radius-full', borderRadius('full')), 'focus-visible': mediumRadius } },
	};

	const flow = { block: { display: 'flex' }, inline: { display: 'inline' } };
	const action = { clickable: { cursor: 'pointer' }, muted: { cursor: 'not-allowed' } };
	const scale = { default: font('micro'), medium: font('c2'), large: font('p2b') };

	// The label has no `rcx-box`, so it states what a plain `span` is: a Text frame restates the View defaults it doesn't
	const label = {
		render: 'span',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 0,
		minHeight: 'auto',
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis',
	};

	return [
		`const tagFrame = ${literal(frame)} as const;`,
		`const tagTone = ${literal(tone)} as const;`,
		`const tagFill = ${literal(fill)} as const;`,
		`const tagShape = ${literal(shape)} as const;`,
		`const tagFlow = ${literal(flow)} as const;`,
		`const tagAction = ${literal(action)} as const;`,
		`const tagScale = ${literal(scale)} as const;`,
		`const tagLabelFrame = ${literal({ ...textFrameDefaults(label), ...label })} as const;`,
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Tag/Tag.tsx'), generate: generateTag }];

export default targets;
