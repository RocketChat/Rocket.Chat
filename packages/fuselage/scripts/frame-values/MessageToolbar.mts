import { join } from 'node:path';

import { constant, messageReveal } from './lib/messageFrames.mts';
import { messagePalettes } from './lib/messagePalettes.mts';
import type { Target } from './lib/target.mts';
import { offScale, zIndex } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { backgroundColor, borderWidth, spacing, strokeColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message/MessageToolbar', file);

const palettes = messagePalettes();

const generateMessageToolbarWrapper = () => {
	// Its `display` comes from the stylesheet with the rest of the reveal, so the frame leaves it out
	const { display: _display, ...frame } = webDefaults({ render: 'div', userSelect: 'none' });

	return [
		constant('messageToolbarWrapperFrame', frame),
		// Out of the row's flow, so it takes no room and no gap
		constant('messageToolbarWrapperOverlay', { true: { position: 'absolute', top: 0, insetInlineEnd: 0 } }),
	].join('\n\n');
};

const generateMessageToolbar = () => {
	const frame = webDefaults({
		render: 'div',
		display: 'block',
		marginInline: spacing('x20')!,
		padding: offScale(2),
		borderWidth: borderWidth('default'),
		borderStyle: 'solid',
		borderColor: strokeColor('extra-light'),
		borderRadius: palettes.toolbarBorderRadius,
		backgroundColor: backgroundColor('room'),
	});

	return [
		constant('messageToolbarFrame', frame),
		constant('messageToolbarOverlay', {
			true: { position: 'absolute', zIndex: zIndex.sticky, top: spacing('-x24')!, insetInlineEnd: 0 },
		}),
	].join('\n\n');
};

const generateStyles = () => {
	const revealed = 'pointer-events: auto;\n\n\topacity: 1;';

	return `/* The reveal of the toolbar and its wrapper: one rule set for the row's hover, its focus, a focus inside it and the pinned wrapper. :hover stays outside a hover media query, so a tap keeps the toolbar shown as on develop */
.rcx-message-toolbar__wrapper {
	display: none;
}

.rcx-message:hover .rcx-message-toolbar__wrapper,
.rcx-message:focus-within .rcx-message-toolbar__wrapper,
.rcx-message-toolbar__wrapper--visible {
	display: inline-block;
}

${messageReveal('.rcx-message-toolbar')}

.rcx-message-toolbar__wrapper--visible .rcx-message-toolbar {
	${revealed}
}`;
};

const targets: Target[] = [
	{ file: component('MessageToolbarWrapper.tsx'), generate: generateMessageToolbarWrapper },
	{ file: component('MessageToolbar.tsx'), generate: generateMessageToolbar },
	{ file: component('MessageToolbar.styles.css'), generate: generateStyles, css: true },
];

export default targets;
