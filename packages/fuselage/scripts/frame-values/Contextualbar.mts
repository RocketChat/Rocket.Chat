import { join } from 'node:path';

import { font, textIconColor } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { zIndex } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { strokeColors, surfaceColors } from '../../src/Theme.ts';
import { borderWidth, size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Contextualbar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const textFrame = (frame: Record<string, Value>) => ({ ...textFrameDefaults(frame), ...frame });

const divider = () => strokeColors['stroke-extra-light'].toString();

// The bar is in the flow beside the room, or over it; the stacking and the edge it sticks to are the same for all of them
const generateContextualbar = () => {
	const bar = webDefaults({
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		zIndex: zIndex.sticky,
		insetBlockStart: 0,
		insetInlineEnd: 0,
		height: size('full')!,
		color: textIconColor('font-default'),
		backgroundColor: surfaceColors['surface-room'].toString(),
		borderInlineStartColor: divider(),
		borderInlineStartWidth: borderWidth('default'),
	});

	return [
		constant('barFrame', bar),
		constant('barPlacements', {
			static: { position: 'static' },
			relative: { position: 'relative' },
			absolute: { position: 'absolute' },
			fixed: { position: 'fixed' },
		}),
		constant('barStretch', { width: size('full')! }),
	].join('\n\n');
};

const generateHeader = () => {
	const header = webDefaults({
		render: 'div',
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0,
		height: size('x44')!,
		paddingInline: spacing('x16')!,
		borderBlockEndColor: divider(),
		borderBlockEndWidth: borderWidth('default'),
	});

	// The row bleeds out of the padding by the room the focus ring of its buttons needs, so the ring is not clipped
	const inner = webDefaults({
		render: 'div',
		display: 'flex',
		overflow: 'hidden',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexGrow: 1,
		height: size('full')!,
		marginInline: spacing('-x4')!,
		paddingInline: spacing('x4')!,
		gap: spacing('x8')!,
	});

	return [constant('headerFrame', header), constant('headerInnerFrame', inner)].join('\n\n');
};

const generateContent = () => {
	const content = webDefaults({
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		overflowY: 'hidden',
		height: size('full')!,
		paddingInline: spacing('x24')!,
	});

	return [
		constant('contentFrame', textFrame(content)),
		// One table for both paddings: the compiler can't resolve two conditional props that both contribute a padding
		constant('contentPaddings', {
			'regular': {},
			'flush': { paddingInline: 0 },
			'spaced': { paddingBlock: spacing('x12')! },
			'flush-spaced': { paddingInline: 0, paddingBlock: spacing('x12')! },
		}),
	].join('\n\n');
};

const generateEmptyContent = () =>
	constant('emptyFrame', webDefaults({ render: 'div', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }));

const generateSection = () =>
	constant(
		'sectionFrame',
		textFrame(
			webDefaults({
				render: 'div',
				display: 'flex',
				alignItems: 'center',
				flexGrow: 1,
				padding: spacing('x16')!,
				borderBlockEndColor: divider(),
				borderBlockEndWidth: borderWidth('default'),
			}),
		),
	);

const generateFooter = () =>
	constant(
		'footerFrame',
		textFrame(webDefaults({ render: 'div', display: 'block', paddingBlock: spacing('x20')!, paddingInline: spacing('x16')! })),
	);

const generateTitle = () =>
	constant(
		'titleFrame',
		textFrame(
			webDefaults({
				render: 'h5',
				display: 'block',
				margin: 0,
				padding: 0,
				flexGrow: 1,
				flexShrink: 1,
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
				...font('h5'),
			}),
		),
	);

const generateSkeleton = () =>
	constant(
		'skeletonFrame',
		webDefaults({ render: 'div', display: 'flex', flexDirection: 'column', padding: spacing('x24')!, gap: spacing('x4')! }),
	);

const targets: Target[] = [
	{ file: component('Contextualbar.tsx'), generate: generateContextualbar },
	{ file: component('ContextualbarHeader.tsx'), generate: generateHeader },
	{ file: component('ContextualbarContent.tsx'), generate: generateContent },
	{ file: component('ContextualbarEmptyContent.tsx'), generate: generateEmptyContent },
	{ file: component('ContextualbarSection.tsx'), generate: generateSection },
	{ file: component('ContextualbarFooter.tsx'), generate: generateFooter },
	{ file: component('ContextualbarTitle.tsx'), generate: generateTitle },
	{ file: component('ContextualbarSkeleton.tsx'), generate: generateSkeleton },
];

export default targets;
