import { join } from 'node:path';

import {
	buttonChrome,
	disabledPaint,
	focusRing,
	kindColors,
	paintStyle,
	pressNudge,
	segmentCorners,
	segmentRaise,
	segmentRaiseBadged,
	squareLayout,
	squaredSize,
	statesOf,
} from './lib/buttonFrames.mts';
import type { Colors, Kind } from './lib/buttonFrames.mts';
import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { fontScale, themed } from './lib/tokens.mts';

const secondary = kindColors('secondary');

/** A palette with no background at rest, which feeds back with the secondary Button's states. */
const bare = (own: Pick<Colors, 'color' | 'focusShadow' | 'disabledColor'>): Colors => ({
	...secondary,
	...own,
	background: 'transparent',
	border: 'transparent',
	disabledBackground: 'transparent',
	disabledBorder: 'transparent',
});

const status = (name: 'info' | 'success' | 'warning' | 'danger', owner: Kind) =>
	bare({
		color: themed(`status-font-on-${name}`),
		// info keeps the ring of the plain icon button
		focusShadow: name === 'info' ? secondary.focusShadow : kindColors(owner).focusShadow,
		disabledColor: kindColors(owner).disabledBackground,
	});

const barePalettes = {
	icon: bare(secondary),
	info: status('info', 'primary'),
	success: status('success', 'success'),
	warning: status('warning', 'warning'),
	danger: status('danger', 'danger'),
};

// The filled variants take the palette of the Button kind their name drops the `secondary` from
const filledPalettes = {
	'secondary': kindColors('secondary'),
	'secondary-info': kindColors('primary'),
	'secondary-success': kindColors('success'),
	'secondary-warning': kindColors('warning'),
	'secondary-danger': kindColors('danger'),
};

/** Pressed shows the secondary Button's press colors at rest: hover, press and focus still win over it. */
const pressedStyle = (colors: Colors) => paintStyle({ ...colors, background: secondary.activeBackground, border: secondary.activeBorder });

const ghostTones = { default: 'secondary', danger: 'danger', warning: 'warning', success: 'success', primary: 'primary' } as const;

/**
 * The trigger of a SplitButton, per tone of the group: it shows the group's translucent background through it and feeds
 * back with the tone's own colors at the same translucency.
 */
const ghostStyle = (kind: Kind) => {
	const translucent = (state: 'focus' | 'hover' | 'press') =>
		`color-mix(in srgb, ${themed(`button-background-${kind}-${state}`)} 70%, transparent)`;

	return {
		color: themed(`button-font-on-${kind}`),
		borderColor: 'transparent',
		backgroundColor: statesOf(['transparent', translucent('focus'), translucent('hover'), translucent('press')]),
		boxShadow: focusRing(secondary.focusShadow),
	};
};

const generateIconButton = () => {
	const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

	const paints: Record<string, Value> = {};
	for (const [name, colors] of Object.entries(barePalettes)) {
		paints[name] = paintStyle(colors);
		paints[`${name}-pressed`] = pressedStyle(colors);
		paints[`${name}-disabled`] = disabledPaint(colors);
	}
	for (const [name, colors] of Object.entries(filledPalettes)) {
		paints[name] = paintStyle(colors);
		paints[`${name}-disabled`] = disabledPaint(colors);
	}
	for (const [tone, kind] of Object.entries(ghostTones)) {
		paints[`ghost-${tone}`] = ghostStyle(kind);
		paints[`ghost-${tone}-disabled`] = { cursor: 'not-allowed', ...ghostStyle(kind) };
	}

	const corner = (block: 'insetBlockStart' | 'insetBlockEnd') => ({
		insetBlockStart: block === 'insetBlockStart' ? 0 : 'auto',
		insetBlockEnd: block === 'insetBlockEnd' ? 0 : 'auto',
	});

	return [
		constant('iconButtonFrame', {
			...buttonChrome,
			render: 'button',
			...squareLayout,
			...fontScale('p2m'),
			lineHeight: '0',
		}),
		constant('iconButtonPaints', paints),
		constant('iconButtonBoxes', {
			mini: squaredSize('x20'),
			tiny: squaredSize('x24'),
			small: squaredSize('x28'),
			medium: squaredSize('x32'),
			large: squaredSize('x40'),
		}),
		constant('iconButtonLayers', {
			'badged': { overflow: 'visible', position: 'relative' },
			'segmented': segmentRaise,
			'segmented-badged': segmentRaiseBadged,
		}),
		constant('iconButtonSegments', segmentCorners),
		constant('iconButtonContent', {
			render: 'span',
			// A Text frame is a content box on the runtime and a border box when compiled
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			// The icon may be wider than the button's content box, an avatar as wide as the button for one, and shrinks with it
			minWidth: 0,
			whiteSpace: 'inherit',
			wordWrap: 'inherit',
			...pressNudge,
		}),
		constant('iconButtonGlyphs', {
			default: { color: themed('font-default') },
			danger: { color: themed('font-danger') },
		}),
		constant('iconButtonBadge', {
			render: 'span',
			position: 'absolute',
			insetInlineEnd: 0,
			display: 'flex',
			whiteSpace: 'inherit',
			wordWrap: 'inherit',
			...pressNudge,
		}),
		constant('iconButtonCorners', { 'top-end': corner('insetBlockStart'), 'bottom-end': corner('insetBlockEnd') }),
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Button/IconButton.tsx'), generate: generateIconButton }];

export default targets;
