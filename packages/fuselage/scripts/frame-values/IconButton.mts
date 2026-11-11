import { join } from 'node:path';

import {
	buttonBoxShadow,
	buttonChrome,
	disabledStyle,
	font,
	paintStyle,
	segmentRaise,
	segmentRaiseBadged,
	segmentVariants,
	squaredSize,
	statesOf,
} from './lib/buttonFrames.mts';
import { ghostPalettes, iconPalettes, kindColors, kinds } from './lib/buttonPalettes.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { fontColor } from '../../src/styleTokens.ts';

const file = join(import.meta.dirname, '../../src/components/Button/IconButton.tsx');

const camelName = (name: string) => name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

/** Pressed shows its own background and border at rest, as the hover, press and focus states still win over it. */
const pressedStyle = (style: Value, background: string, border: string): Value => {
	const { backgroundColor, borderColor, ...rest } = style as Record<string, Value>;

	return {
		...rest,
		borderColor: { ...(borderColor as Record<string, Value>), default: border },
		backgroundColor: { ...(backgroundColor as Record<string, Value>), default: background },
	};
};

const generateIconButton = () => {
	const out: string[] = [];
	const constant = (name: string, value: Value) => out.push(`const ${name} = ${literal(value)};`);

	const addPaint = (name: string, resting: Value, pressed: Value, disabled: Value) => {
		constant(camelName(name), resting);
		constant(`${camelName(name)}Pressed`, pressed);
		constant(`${camelName(name)}Disabled`, disabled);
	};

	for (const [name, { colors: c, pressedBackground, pressedBorder }] of Object.entries(iconPalettes())) {
		const resting = paintStyle(c);
		addPaint(name, resting, pressedStyle(resting, pressedBackground, pressedBorder), disabledStyle(c));
	}

	// Only the icon palettes have a pressed colour; for these, pressing changes nothing
	const kindOf: Record<string, keyof typeof kinds> = {
		'secondary': 'secondary',
		'secondary-info': 'primary',
		'secondary-success': 'success',
		'secondary-warning': 'warning',
		'secondary-danger': 'danger',
	};

	for (const [name, kind] of Object.entries(kindOf)) {
		const colors = kindColors(kind, kinds[kind]);
		addPaint(name, paintStyle(colors), paintStyle(colors), disabledStyle(colors));
	}

	// The trigger of a `SplitButton` shows the group's background through it, whatever its variant, pressed or not
	const ring = buttonBoxShadow(iconPalettes().icon.colors);
	for (const [name, g] of Object.entries(ghostPalettes())) {
		const ghost = {
			color: g.color,
			borderColor: statesOf(Array(4).fill('transparent') as string[]),
			backgroundColor: statesOf(['transparent', g.focusBackground, g.hoverBackground, g.activeBackground]),
			boxShadow: ring,
		};
		const paint = name === 'default' ? 'ghost' : `ghost-${name}`;
		constant(camelName(paint), ghost);
		constant(`${camelName(paint)}Disabled`, { cursor: 'not-allowed', ...ghost });
	}

	constant('segment', segmentVariants);
	constant('segmentRaise', segmentRaise);
	constant('segmentRaiseBadged', segmentRaiseBadged);

	const sides = { mini: 20, tiny: 24, small: 28, medium: 32, large: 40 };
	for (const [name, side] of Object.entries(sides)) {
		constant(`${name}Box`, squaredSize(side));
	}

	constant('frame', {
		...buttonChrome,
		render: 'button',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
		flexGrow: 0,
		flexBasis: 'auto',
		...font('p2m'),
		lineHeight: 0,
	});

	constant('defaultGlyph', { color: fontColor('default') });
	constant('dangerGlyph', { color: fontColor('danger') });

	// `none` can't be followed by another function, so pressing what has no transform of its own is the nudge alone
	const nudge = (transform: string) => ({
		transform: { 'default': transform, 'group-press/button': transform === 'none' ? 'translateY(1px)' : `${transform} translateY(1px)` },
	});
	// A variant's group state is written ahead of its resting value, which then wins, so the badge's offset is one base value;
	// `--rcx-badge-y` is 1 on the top corner and -1 on the bottom one, set by the stylesheet
	const corner = (block: 'insetBlockStart' | 'insetBlockEnd') => ({
		insetBlockStart: block === 'insetBlockStart' ? 0 : 'auto',
		insetBlockEnd: block === 'insetBlockEnd' ? 0 : 'auto',
	});

	constant('topEnd', corner('insetBlockStart'));
	constant('bottomEnd', corner('insetBlockEnd'));

	constant('badge', {
		render: 'span',
		position: 'absolute',
		insetInlineEnd: 0,
		display: 'flex',
		whiteSpace: 'inherit',
		wordWrap: 'inherit',
		...nudge('translate(calc(30% * var(--rcx-dir)), calc(-30% * var(--rcx-badge-y, 1)))'),
	});
	constant('content', {
		render: 'span',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		// The icon may be wider than the button's content box, an avatar as wide as the button for one, and shrinks with it
		minWidth: 0,
		whiteSpace: 'inherit',
		wordWrap: 'inherit',
		...nudge('none'),
	});

	return out.join('\n\n');
};

export default [{ file, generate: generateIconButton }] satisfies Target[];
