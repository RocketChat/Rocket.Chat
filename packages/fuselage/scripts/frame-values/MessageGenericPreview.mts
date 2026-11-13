import { join } from 'node:path';

import { font, themed } from './lib/frameTokens.mts';
import { textFrame } from './lib/itemFrames.mts';
import { linkStates } from './lib/linkStates.mts';
import { literal } from './lib/literal.mts';
import { messagePalettes } from './lib/messagePalettes.mts';
import type { Target } from './lib/target.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { borderRadius, borderWidth, fontColor, size, spacing, strokeColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message/MessageGenericPreview', file);

const { genericPreview: palette } = messagePalettes();

const truncated = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const mediumRadius = themed('border-radius-medium', borderRadius('medium'));

const generateRoot = () =>
	`const messageGenericPreviewFrame = ${literal(
		webDefaults({
			render: 'div',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
			color: palette.context,
			borderWidth: borderWidth('default'),
			borderStyle: 'solid',
			borderColor: palette.border,
			borderRadius: mediumRadius,
			backgroundColor: palette.contentBackground,
		}),
	)} as const;`;

const generateContent = () =>
	[
		`const messageGenericPreviewContentFrame = ${literal(webDefaults({ render: 'div', display: 'flex', flexDirection: 'row' }))} as const;`,
		`const messageGenericPreviewContentWrapperFrame = ${literal(
			webDefaults({
				render: 'div',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				flexGrow: 1,
				...truncated,
				paddingBlock: spacing('x8'),
				paddingInline: spacing('x16'),
			}),
		)} as const;`,
	].join('\n\n');

// The image and its ratio come in through the custom properties the part sets on itself
const generateCoverImage = () =>
	[
		`const messageGenericPreviewCoverImageFrame = ${literal(
			webDefaults({
				render: 'div',
				overflow: 'hidden',
				width: '100%',
				height: '100%',
				maxWidth: '100%',
				backgroundImage: 'var(--rcx-message-generic-preview-cover-image)',
				backgroundRepeat: 'no-repeat',
				backgroundPosition: '50%',
				backgroundSize: 'cover',
			}),
		)} as const;`,
		`const messageGenericPreviewCoverRatioFrame = ${literal(
			webDefaults({ render: 'div', boxSizing: 'content-box', paddingTop: 'var(--rcx-message-generic-preview-cover-ratio)' }),
		)} as const;`,
	].join('\n\n');

// A link's colour is the link-state stylesheet's, so the text kind alone sets one and the link kind only draws the focus ring
const generateTitle = () => {
	const frame = textFrame({
		render: 'span',
		display: 'block',
		...truncated,
		marginBlockEnd: spacing('x4'),
		...font('p2'),
	});

	const ring = {
		textDecorationLine: { 'focus-visible': 'none' },
		borderRadius: { 'focus-visible': borderRadius('small') },
		outlineWidth: { 'focus-visible': '1px' },
		outlineStyle: { 'focus-visible': 'solid' },
		outlineColor: { 'focus-visible': themed('link-focus-outline-color', strokeColor('highlight')) },
		outlineOffset: { 'focus-visible': 0 },
		boxShadow: {
			'focus-visible': `0 0 0 ${borderWidth('medium')} ${themed('link-focus-box-shadow-color', strokeColor('extra-light-highlight'))}`,
		},
	};

	return [
		`const messageGenericPreviewTitleFrame = ${literal(frame)} as const;`,
		`const messageGenericPreviewTitleKinds = ${literal({ text: { color: palette.title }, link: ring })} as const;`,
	].join('\n\n');
};

const generateDescription = () => {
	const frame = textFrame({
		render: 'div',
		display: 'block',
		marginBlockEnd: spacing('x4'),
		color: palette.description,
		...font('c1'),
	});

	// The clamp is the Text's `numberOfLines`; it only needs the lines to wrap
	const lines = { single: truncated, clamp: { whiteSpace: 'normal' } };

	return [
		`const messageGenericPreviewDescriptionFrame = ${literal(frame)} as const;`,
		`const messageGenericPreviewDescriptionLines = ${literal(lines)} as const;`,
	].join('\n\n');
};

const generateFooter = () =>
	`const messageGenericPreviewFooterFrame = ${literal(
		textFrame({ render: 'div', display: 'block', ...truncated, width: '100%', color: palette.context, ...font('c1') }),
	)} as const;`;

const generateThumb = () =>
	`const messageGenericPreviewThumbFrame = ${literal(
		webDefaults({ render: 'div', width: size('x96')!, height: size('x96')!, flexShrink: 0 }),
	)} as const;`;

const generateImage = () =>
	`const messageGenericPreviewImageFrame = ${literal(
		webDefaults({
			render: 'img',
			display: 'inline',
			width: 'fit-content',
			maxWidth: 'inherit',
			maxHeight: 'inherit',
			cursor: 'pointer',
		}),
	)} as const;`;

const generateIcon = () =>
	[
		`const messageGenericPreviewIconFrame = ${literal(
			webDefaults({
				render: 'div',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				flexShrink: 0,
				alignSelf: 'center',
				width: size('x48')!,
				height: size('x52')!,
				marginBlock: spacing('x12'),
				marginInlineStart: spacing('x16'),
				color: fontColor('default'),
				borderRadius: mediumRadius,
				backgroundColor: palette.iconBackground,
			}),
		)} as const;`,
		`const messageGenericPreviewIconTitleFrame = ${literal(
			textFrame({
				render: 'div',
				display: 'block',
				...truncated,
				maxWidth: size('x40')!,
				color: palette.title,
				...font('micro'),
			}),
		)} as const;`,
	].join('\n\n');

// The link's colour in each state, and the focus ring of the links in the footer's rich text; a frame can't express :visited and :active
const generateCss = () => {
	const footerLinks = '.rcx-message-generic-preview__footer a';

	return [
		linkStates('.rcx-message-generic-preview__title-link', fontColor('info')),
		linkStates(footerLinks, fontColor('secondary-info')),
		`${footerLinks}:focus-visible {
	text-decoration: none;

	border-radius: ${borderRadius('small')};
	outline: ${themed('link-focus-outline-color', strokeColor('highlight'))} solid 1px;
	outline-offset: 0;
	box-shadow: 0 0 0 ${borderWidth('medium')} ${themed('link-focus-box-shadow-color', strokeColor('extra-light-highlight'))};
}`,
	].join('\n\n');
};

const targets: Target[] = [
	{ file: component('MessageGenericPreview.tsx'), generate: generateRoot },
	{ file: component('MessageGenericPreviewContent.tsx'), generate: generateContent },
	{ file: component('MessageGenericPreviewCoverImage.tsx'), generate: generateCoverImage },
	{ file: component('MessageGenericPreviewTitle.tsx'), generate: generateTitle },
	{ file: component('MessageGenericPreviewDescription.tsx'), generate: generateDescription },
	{ file: component('MessageGenericPreviewFooter.tsx'), generate: generateFooter },
	{ file: component('MessageGenericPreviewThumb.tsx'), generate: generateThumb },
	{ file: component('MessageGenericPreviewImage.tsx'), generate: generateImage },
	{ file: component('MessageGenericPreviewIcon.tsx'), generate: generateIcon },
	{ file: component('MessageGenericPreview.styles.css'), generate: generateCss, css: true },
];

export default targets;
