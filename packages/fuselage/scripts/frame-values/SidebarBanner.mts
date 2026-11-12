import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import { sidebarPalettes } from './lib/sidebarPalettes.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { strokeColors } from '../../src/Theme.ts';
import { borderRadius, borderWidth, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const textFrame = (frame: Record<string, Value>) => ({ ...textFrameDefaults(frame), ...frame });

const generateBanner = () => {
	const palettes = sidebarPalettes();

	const frame = webDefaults({
		render: 'div',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: spacing('x16')!,
		borderBlockEndStyle: 'solid',
		borderBlockEndColor: palettes.accordionBorder,
		borderBlockEndWidth: borderWidth('default'),
		gap: spacing('x12')!,
	});

	const tones = Object.fromEntries(
		Object.entries(palettes.banner).map(([tone, { color, background }]) => [tone, { color, backgroundColor: background }]),
	);

	const title = textFrame(webDefaults({ render: 'h5', display: 'block', margin: 0, padding: 0, ...font('h5') }));

	const addon = webDefaults({ render: 'div', display: 'flex', alignItems: 'center' });

	const link = webDefaults({
		display: 'inline-block',
		cursor: 'pointer',
		textDecorationLine: 'underline',
		...font('p2m'),
	});

	// Without an `href` the action is a button, which paints as a link and shows the ring a link shows on focus
	const small = themed('border-radius-small', borderRadius('small'));
	const info = textIconColor('font-info');
	const button = webDefaults({
		...link,
		render: 'button',
		textAlign: 'center',
		backgroundColor: 'transparent',
		color: {
			default: themed('link-color', info),
			focus: themed('link-focus-color', info),
			press: themed('link-active-color', info),
		},
		textDecorationLine: { 'default': 'underline', 'focus-visible': 'none' },
		borderRadius: { 'default': 0, 'focus-visible': small },
		outlineWidth: { 'focus-visible': borderWidth('default') },
		outlineStyle: { 'focus-visible': 'solid' },
		outlineColor: { 'focus-visible': themed('link-focus-outline-color', strokeColors['stroke-highlight'].toString()) },
		outlineOffset: { 'focus-visible': 0 },
		boxShadow: {
			'focus-visible': `0 0 0 ${borderWidth('medium')} ${themed('link-focus-box-shadow-color', strokeColors['stroke-extra-light-highlight'].toString())}`,
		},
	});

	return [
		constant('bannerFrame', frame),
		constant('bannerTones', tones),
		constant('titleFrame', title),
		constant('addonFrame', addon),
		constant('anchorFrame', textFrame({ ...link, render: 'a' })),
		constant('buttonFrame', textFrame(button)),
	].join('\n\n');
};

const targets: Target[] = [{ file: component('SidebarBanner.tsx'), generate: generateBanner }];

export default targets;
