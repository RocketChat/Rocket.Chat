import { join } from 'node:path';

import { elevation } from './lib/elevation.mts';
import { font, statusFont, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { zIndex } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Modal', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

// The margin the header, the content and the footer keep from the edges of the modal
const containerMargin = () => themed('modal-container-margin', size('x24')!);

const textFrame = (frame: Record<string, Value>) => ({ ...textFrameDefaults(frame), ...frame });

// A `dialog` is absolute, fit-content, padded, bordered and painted by the browser: the frame says what it keeps of that
const generateModal = () => {
	const dialog = webDefaults({
		render: 'dialog',
		display: 'flex',
		position: 'static',
		width: 'var(--rcx-modal-width, 100%)',
		height: 'var(--rcx-modal-height, fit-content)',
		maxHeight: 'var(--rcx-modal-max-height, 100%)',
		maxWidth: { sm: size('x640')! },
		margin: themed('modal-margin', 'auto'),
		padding: { default: 0, sm: spacing('x16')! },
		borderWidth: 0,
		borderStyle: 'solid',
		borderColor: 'currentColor',
		color: 'CanvasText',
		backgroundColor: 'transparent',
	});

	const inner = webDefaults({
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1,
		width: '100%',
		minWidth: 0,
		padding: 0,
		color: textIconColor('font-default'),
		borderRadius: themed('modal-border-radius', themed('border-radius-large', borderRadius('large'))),
		backgroundColor: surfaceColors['surface-light'].toString(),
		...font('p2'),
		...elevation()['2'],
	});

	return [constant('modalFrame', dialog), constant('modalHidden', { display: 'none' }), constant('modalInnerFrame', textFrame(inner))].join(
		'\n\n',
	);
};

const generateBackdrop = () => {
	const backdrop = webDefaults({
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		position: 'fixed',
		zIndex: zIndex.overlay,
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		backgroundColor: surfaceColors['surface-overlay'].toString(),
	});

	return [
		constant('backdropFrame', backdrop),
		constant('backdropContained', { position: 'absolute' }),
		constant('backdropTransparent', { backgroundColor: 'transparent' }),
	].join('\n\n');
};

const generateHeader = () =>
	[
		constant('headerFrame', webDefaults({ render: 'header', display: 'block', margin: containerMargin() })),
		constant(
			'headerInnerFrame',
			webDefaults({ render: 'div', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: spacing('x8')! }),
		),
	].join('\n\n');

const generateHeaderText = () =>
	constant(
		'headerTextFrame',
		webDefaults({
			render: 'div',
			display: 'flex',
			flexDirection: 'column',
			flexGrow: 1,
			flexShrink: 1,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
		}),
	);

const generateTitle = () =>
	constant(
		'titleFrame',
		textFrame(
			webDefaults({
				render: 'h2',
				display: 'block',
				margin: 0,
				padding: 0,
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				flexGrow: 1,
				flexShrink: 1,
				whiteSpace: 'nowrap',
				color: textIconColor('font-default'),
				...font('h2'),
			}),
		),
	);

const generateTagline = () => {
	const tagline = webDefaults({ render: 'div', display: 'block', color: textIconColor('font-default'), ...font('c2') });

	return [
		constant('taglineFrame', textFrame(tagline)),
		constant('taglineLooks', { plain: {}, subtle: { color: textIconColor('font-annotation') } }),
	].join('\n\n');
};

const generateIcon = () => {
	const icon = webDefaults({ render: 'div', display: 'flex', paddingBlock: spacing('x4')! });

	return [
		constant('iconFrame', icon),
		constant('iconAlignments', { center: { alignItems: 'center' }, end: { alignItems: 'end' } }),
		constant('iconTones', {
			plain: {},
			danger: { color: textIconColor('font-danger') },
			warning: { color: statusFont('warning') },
			info: { color: textIconColor('font-info') },
			success: { color: statusFont('success') },
		}),
	].join('\n\n');
};

const generateHeroImage = () => {
	const bleed = size('-x24')!;

	return [
		constant(
			'heroFigureFrame',
			webDefaults({ render: 'figure', display: 'block', margin: 0, marginBlockEnd: size('x24')!, marginInline: bleed }),
		),
		constant(
			'heroImageFrame',
			webDefaults({
				render: 'img',
				display: 'block',
				width: 'var(--rcx-modal-hero-image-width, 100%)',
				height: 'var(--rcx-modal-hero-image-height, auto)',
				objectFit: 'contain',
			}),
		),
	].join('\n\n');
};

const generateContent = () => {
	const scroll = webDefaults({ render: 'div', display: 'block', position: 'relative', overflowY: 'auto' });
	const wrapper = textFrame(webDefaults({ render: 'div', display: 'block', marginInline: spacing('x24')! }));

	return [
		constant('contentFrame', scroll),
		constant('contentWrapperFrame', wrapper),
		constant('contentWrapperFill', { true: { height: '100%', paddingBlockEnd: spacing('x16')! }, false: {} }),
	].join('\n\n');
};

const generateFooter = () => {
	const footer = webDefaults({
		render: 'div',
		display: 'flex',
		alignItems: 'center',
		margin: containerMargin(),
	});

	return [
		constant('footerFrame', footer),
		constant('footerJustifications', { 'end': { justifyContent: 'end' }, 'space-between': { justifyContent: 'space-between' } }),
	].join('\n\n');
};

const generateFooterAnnotation = () =>
	constant(
		'annotationFrame',
		textFrame(webDefaults({ render: 'div', display: 'block', color: textIconColor('font-secondary-info'), ...font('c1') })),
	);

const generateThumb = () => constant('thumbFrame', webDefaults({ render: 'div', display: 'block' }));

// Pseudo-elements on the part's own element: the scrollbar of the content, and the registrations of the open sizes
const generateModalStyles = () => `@property --rcx-modal-width {
	inherits: false;
	syntax: '*';
}

@property --rcx-modal-height {
	inherits: false;
	syntax: '*';
}

@property --rcx-modal-max-height {
	inherits: false;
	syntax: '*';
}

@property --rcx-modal-hero-image-width {
	inherits: false;
	syntax: '*';
}

@property --rcx-modal-hero-image-height {
	inherits: false;
	syntax: '*';
}

.rcx-modal__content::-webkit-scrollbar {
	width: ${spacing('x4')};
	height: ${spacing('x4')};
}

.rcx-modal__content::-webkit-scrollbar-track {
	background-color: transparent;
}

.rcx-modal__content::-webkit-scrollbar-thumb {
	background-color: ${themed('theme-scrollbar-thumb-color', 'rgba(0, 0, 0, 0.05)')};
}

.rcx-modal__content:hover::-webkit-scrollbar-thumb {
	background-color: ${themed('theme-scrollbar-thumb-hover-color', 'rgba(0, 0, 0, 0.15)')};
}`;

const targets: Target[] = [
	{ file: component('Modal.tsx'), generate: generateModal },
	{ file: component('ModalBackdrop.tsx'), generate: generateBackdrop },
	{ file: component('ModalHeader.tsx'), generate: generateHeader },
	{ file: component('ModalHeaderText.tsx'), generate: generateHeaderText },
	{ file: component('ModalTitle.tsx'), generate: generateTitle },
	{ file: component('ModalTagline.tsx'), generate: generateTagline },
	{ file: component('ModalIcon.tsx'), generate: generateIcon },
	{ file: component('ModalHeroImage.tsx'), generate: generateHeroImage },
	{ file: component('ModalContent.tsx'), generate: generateContent },
	{ file: component('ModalFooter.tsx'), generate: generateFooter },
	{ file: component('ModalFooterAnnotation.tsx'), generate: generateFooterAnnotation },
	{ file: component('ModalThumb.tsx'), generate: generateThumb },
	{ file: component('Modal.styles.css'), generate: generateModalStyles, css: true },
];

export default targets;
