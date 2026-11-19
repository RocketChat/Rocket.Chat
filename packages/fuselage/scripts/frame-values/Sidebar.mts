import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, percent, radius, size, space, themed } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const textFrame = (style: Record<string, Value>) => {
	const frame = webDefaults(style);
	return { ...textFrameDefaults(frame), ...frame };
};

// Only the bottom side has a border, so its style is stated for that side: `borderStyle` would give the other three a width
const bottomLine = {
	borderBlockEndStyle: 'solid',
	borderBlockEndColor: themed('stroke-light'),
	borderBlockEndWidth: 1,
};

const generateSidebar = () =>
	constant(
		'sidebarFrame',
		webDefaults({
			render: 'nav',
			display: 'flex',
			flexDirection: 'column',
			position: 'relative',
			height: percent(100),
			color: themed('font-default'),
			backgroundColor: themed('surface-sidebar'),
		}),
	);

const generateSection = () =>
	constant(
		'sectionFrame',
		webDefaults({
			render: 'div',
			display: 'flex',
			alignItems: 'center',
			height: size('x44'),
			paddingInline: space('x16'),
			gap: space('x8'),
		}),
	);

const generateFooter = () =>
	constant(
		'footerFrame',
		webDefaults({
			render: 'footer',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			minHeight: size('x48'),
			paddingBlockStart: space('x12'),
			paddingBlockEnd: space('x8'),
			paddingInline: space('x16'),
			color: themed('font-default'),
			backgroundColor: themed('surface-sidebar'),
			gap: space('x4'),
		}),
	);

const generateFooterContent = () => constant('contentFrame', textFrame({ render: 'div', display: 'block', ...fontScale('micro') }));

const generateMedia = () =>
	constant(
		'mediaFrame',
		webDefaults({
			render: 'div',
			display: 'block',
			paddingBlock: space('x8'),
			color: themed('font-titles-labels'),
			...bottomLine,
			backgroundColor: themed('surface-sidebar'),
		}),
	);

const generateMediaTitle = () =>
	constant(
		'titleFrame',
		textFrame({
			render: 'div',
			display: 'block',
			flexGrow: 1,
			paddingBlockEnd: space('x4'),
			paddingInline: space('x16'),
			textAlign: 'center',
			...fontScale('c1'),
		}),
	);

const generateMediaController = () =>
	[
		constant(
			'controllerFrame',
			webDefaults({
				render: 'div',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				paddingInline: space('x16'),
			}),
		),
		constant('labelFrame', textFrame({ render: 'div', display: 'block', ...fontScale('p2') })),
	].join('\n\n');

const bannerTones = ['info', 'success', 'warning', 'danger'] as const;

const generateBanner = () => {
	const frame = webDefaults({
		render: 'div',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: space('x16'),
		...bottomLine,
		gap: space('x12'),
	});

	const tones = {
		default: { color: themed('font-titles-labels'), backgroundColor: themed('surface-sidebar') },
		...Object.fromEntries(
			bannerTones.map((tone) => [tone, { color: themed(`status-font-on-${tone}`), backgroundColor: themed(`status-background-${tone}`) }]),
		),
	};

	return [
		constant('bannerFrame', frame),
		constant('bannerTones', tones),
		constant('titleFrame', textFrame({ render: 'h5', display: 'block', margin: 0, padding: 0, ...fontScale('h5') })),
		constant('addonFrame', webDefaults({ render: 'div', display: 'flex', alignItems: 'center' })),
	].join('\n\n');
};

const link = {
	display: 'inline-block',
	cursor: 'pointer',
	textDecorationLine: 'underline',
	...fontScale('p2m'),
};

// The link takes the color and the focus ring every anchor gets from the stylesheet
const generateBannerLink = () => constant('linkFrame', textFrame({ render: 'a', ...link }));

// A button has no anchor rule to follow, so it states the color and the focus ring of a link itself
const generateBannerButton = () =>
	constant(
		'buttonFrame',
		textFrame({
			render: 'button',
			...link,
			textAlign: 'start',
			color: themed('font-info'),
			backgroundColor: 'transparent',
			textDecorationLine: { 'default': 'underline', 'focus-visible': 'none' },
			borderRadius: { 'default': radius('zero'), 'focus-visible': radius('small') },
			outlineWidth: { 'default': 0, 'focus-visible': 1 },
			outlineStyle: { 'default': 'none', 'focus-visible': 'solid' },
			outlineColor: { 'focus-visible': themed('stroke-highlight') },
			outlineOffset: { 'focus-visible': 0 },
			boxShadow: { 'focus-visible': `0 0 0 2px ${themed('stroke-extra-light-highlight')}` },
		}),
	);

export default [
	{ file: component('Sidebar.tsx'), generate: generateSidebar },
	{ file: component('SidebarSection.tsx'), generate: generateSection },
	{ file: component('SidebarFooter/SidebarFooter.tsx'), generate: generateFooter },
	{ file: component('SidebarFooter/SidebarFooterContent.tsx'), generate: generateFooterContent },
	{ file: component('SidebarMedia/SidebarMedia.tsx'), generate: generateMedia },
	{ file: component('SidebarMedia/SidebarMediaTitle.tsx'), generate: generateMediaTitle },
	{ file: component('SidebarMedia/SidebarMediaController.tsx'), generate: generateMediaController },
	{ file: component('SidebarBanner/SidebarBanner.tsx'), generate: generateBanner },
	{ file: component('SidebarBanner/SidebarBannerLink.tsx'), generate: generateBannerLink },
	{ file: component('SidebarBanner/SidebarBannerButton.tsx'), generate: generateBannerButton },
] satisfies Target[];
