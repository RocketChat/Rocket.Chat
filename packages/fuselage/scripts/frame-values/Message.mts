import { join } from 'node:path';

import { font } from './lib/frameTokens.mts';
import { itemMediaBase, itemRowBase } from './lib/itemFrames.mts';
import { itemPalettes } from './lib/itemPalettes.mts';
import { constant, focusRing, leanText, truncating } from './lib/messageFrames.mts';
import { messagePalettes } from './lib/messagePalettes.mts';
import type { Target } from './lib/target.mts';
import { offScale } from './lib/tokens.mts';
import { fromCamelToKebab } from '../../src/helpers/fromCamelToKebab.ts';
import { backgroundColor, borderRadius, borderWidth, fontColor, fontScale, size, spacing, strokeColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message', file);

const palettes = messagePalettes();
const item = itemPalettes();

const emojiSize = (fallback: string) => `var(--emoji-size, ${fallback})`;

const generateMessageLeftContainer = () => {
	const column = { ...itemMediaBase, flexDirection: 'column' };

	return [
		constant('messageLeftFrame', { ...column, alignItems: 'flex-end', width: size('x36')! }),
		constant('messageLeftLines', {
			two: { minHeight: `calc(${fontScale('h5').lineHeight} + ${fontScale('p2').lineHeight})` },
			one: { minHeight: fontScale('p2').lineHeight },
		}),
	].join('\n\n');
};

const generateMessageContainerFixed = () => constant('messageFixedFrame', { ...itemMediaBase, flexDirection: 'column' });

const generateMessageRoles = () => constant('messageRolesFrame', { ...itemRowBase, overflow: 'hidden' });

const generateMessageNameContainer = () => {
	const frame = leanText({
		render: 'span',
		flexShrink: 0,
		...truncating,
		color: fontColor('titles-labels'),
		...focusRing(),
	});

	return [
		constant('messageNameContainerFrame', frame),
		// In the header a long name gives way before the timestamp and the indicators do
		constant('messageNameContainerInHeader', { true: { flexShrink: 1 } }),
		constant('messageNameContainerInteractive', { true: { cursor: 'pointer', textDecorationLine: { hover: 'underline' } } }),
	].join('\n\n');
};

const generateMessageName = () =>
	constant('messageNameFrame', leanText({ render: 'span', ...truncating, color: fontColor('titles-labels'), ...font('h5') }));

const generateMessageUsername = () =>
	constant('messageUsernameFrame', leanText({ render: 'span', ...truncating, color: fontColor('default') }));

const generateMessageTimestamp = () =>
	constant(
		'messageTimestampFrame',
		leanText({
			render: 'span',
			display: 'block',
			flexGrow: 0,
			flexShrink: 0,
			whiteSpace: 'nowrap',
			// The secondary color fails contrast against the row's hover surface
			color: { 'default': item.font.secondary, 'group-hover/item': fontColor('default') },
			...font('c1'),
		}),
	);

const generateMessageBody = () => {
	const frame = leanText({
		render: 'div',
		display: 'block',
		overflow: 'hidden',
		// Padding rather than margin, so the clipped overflow leaves room for emoji glyphs that paint past their line box
		paddingBlock: offScale(2),
		wordBreak: 'break-word',
		color: fontColor('default'),
		...font('p2'),
	});

	return [constant('messageBodyFrame', frame), constant('messageBodyPending', { true: { opacity: 0.4 } })].join('\n\n');
};

const generateMessageBlock = () =>
	[
		constant('messageBlockFrame', leanText({ render: 'div', display: 'flex', flexDirection: 'column' })),
		constant('messageBlockFixedWidth', { true: { maxWidth: palettes.blockWidthFixed } }),
	].join('\n\n');

const generateMessageHighlight = () => {
	const frame = leanText({
		render: 'span',
		whiteSpace: 'nowrap',
		fontWeight: 500,
		...focusRing(),
	});

	return [
		constant('messageHighlightFrame', frame),
		constant('messageHighlightTones', {
			critical: { color: palettes.highlight.critical },
			relevant: { color: palettes.highlight.relevant },
			other: { color: palettes.highlight.other },
			link: { color: palettes.highlight.link },
		}),
		constant('messageHighlightClickable', { true: { cursor: 'pointer', textDecorationLine: { hover: 'underline' } } }),
	].join('\n\n');
};

const generateMessageEmojiBase = () => {
	const frame = leanText({
		render: 'span',
		display: 'inline-flex',
		overflow: 'visible',
		justifyContent: 'center',
		marginInline: offScale(2),
		verticalAlign: 'top',
		width: emojiSize(size('x20')!),
		height: emojiSize(size('x20')!),
		fontSize: emojiSize(size('x20')!),
		lineHeight: emojiSize(size('x20')!),
		backgroundImage: 'var(--rcx-message-emoji-image)',
	});

	return [
		constant('messageEmojiFrame', frame),
		// The sprite of a reaction takes the size of its box as is; the message's and the thread's contain it. The thread's sits on the text's middle
		constant('messageEmojiKinds', {
			message: { backgroundSize: 'contain' },
			reaction: {},
			thread: { backgroundSize: 'contain', verticalAlign: 'middle' },
		}),
	].join('\n\n');
};

const declarations = (style: Record<string, string | number>) =>
	Object.entries(style)
		.map(([property, value]) => `\t${fromCamelToKebab(property)}: ${value};`)
		.join('\n');

const generateStyles = () => {
	const heading = (name: 'h1' | 'h2' | 'h3' | 'h4') => `.rcx-message-body ${name} {\n${declarations(font(name))}\n}`;
	const quote = `${borderWidth('default')} solid ${strokeColor('extra-light')}`;

	return `/* Properties Tamagui has no key for: the transition of the body that fades while its message is pending */
.rcx-message-body {
	transition: opacity 0.3s linear;
}

@media (prefers-reduced-motion: reduce) {
	.rcx-message-body {
		transition: none;
	}
}

/* @property registration of the custom property the emoji frame reads its sprite from */
@property --rcx-message-emoji-image {
	syntax: '*';
	inherits: false;
}

/* Component-scoped custom property inputs a frame value reads: the size of an emoji box */
.rcx-message__emoji--big {
	--emoji-size: ${size('x48')};
}

.rcx-message-thread__emoji {
	--emoji-size: ${size('x12')};
}

/* The same gap as the message row, so the preview text starts on the message text column */
.rcx-message-thread__row {
	--rcx-item-gap: ${spacing('x8')};
}

/* Pseudo-elements on the part's own element: a system origin starts with a capital */
.rcx-message-thread__origin--system::first-letter {
	text-transform: uppercase;
}

/* Consumer rich text: the elements the Markdown renderer puts in the body, which the body does not render itself */
${(['h1', 'h2', 'h3', 'h4'] as const).map(heading).join('\n\n')}

.rcx-message-body ul,
.rcx-message-body ol {
	margin: 0;
	padding-block: ${spacing('x4')} 0;
	padding-inline: 0;

	list-style: none;
}

.rcx-message-body :is(ul, ol) > li::before {
	padding: 0 ${spacing('x8')};

	font-weight: bold;
}

.rcx-message-body ul:not(.task-list) > li::before {
	content: '•';
}

.rcx-message-body ol > li::before {
	content: attr(value) '.';
}

.rcx-message-body blockquote {
	padding-inline: ${spacing('x8')};

	border: ${quote};
	border-radius: ${borderRadius('small')};
	background-color: ${backgroundColor('tint')};
	border-inline-start-color: ${strokeColor('medium')};
}

.rcx-message-body blockquote:hover {
	border-color: ${strokeColor('light')};
	background-color: ${backgroundColor('hover')};
	border-inline-start-color: ${strokeColor('medium')};
}`;
};

const targets: Target[] = [
	{ file: component('MessageLeftContainer.tsx'), generate: generateMessageLeftContainer },
	{ file: component('MessageContainerFixed.tsx'), generate: generateMessageContainerFixed },
	{ file: component('MessageRoles.tsx'), generate: generateMessageRoles },
	{ file: component('MessageNameContainer.tsx'), generate: generateMessageNameContainer },
	{ file: component('MessageName.tsx'), generate: generateMessageName },
	{ file: component('MessageUsername.tsx'), generate: generateMessageUsername },
	{ file: component('MessageTimestamp.tsx'), generate: generateMessageTimestamp },
	{ file: component('MessageBody.tsx'), generate: generateMessageBody },
	{ file: component('MessageBlock.tsx'), generate: generateMessageBlock },
	{ file: component('MessageHighlight.tsx'), generate: generateMessageHighlight },
	{ file: component('MessageEmojiBase.tsx'), generate: generateMessageEmojiBase },
	{ file: component('Message.styles.css'), generate: generateStyles, css: true },
];

export default targets;
