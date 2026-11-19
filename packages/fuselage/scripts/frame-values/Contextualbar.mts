import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, percent, size, space, themed, zIndex } from './lib/tokens.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Contextualbar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

// A plain element is a row-direction block that shrinks and sizes to its content, where a View is a column flex that doesn't shrink
const block: Record<string, Value> = {
	display: 'block',
	flexDirection: 'row',
	alignItems: 'normal',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
};

const plain = (style: Record<string, Value>): Record<string, Value> => ({ ...block, ...style });

const textFrame = (frame: Record<string, Value>) => ({ ...textFrameDefaults(frame), ...frame });

const divider = themed('stroke-extra-light');
const hairline = offScale(1);

// The bar is in the flow beside the room, or over it; the stacking and the edge it sticks to are the same for all of them
const generateContextualbar = () => {
	const bar = plain({
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		zIndex: zIndex('sticky'),
		insetBlockStart: 0,
		insetInlineEnd: 0,
		height: percent(100),
		color: themed('font-default'),
		backgroundColor: themed('surface-room'),
		borderInlineStartStyle: 'solid',
		borderInlineStartColor: divider,
		borderInlineStartWidth: hairline,
	});

	return [
		constant('barFrame', bar),
		constant('barPlacements', {
			static: { position: 'static' },
			relative: { position: 'relative' },
			absolute: { position: 'absolute' },
			fixed: { position: 'fixed' },
		}),
		constant('barStretch', { width: percent(100) }),
	].join('\n\n');
};

const generateHeader = () => {
	const header = plain({
		render: 'div',
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0,
		height: size('x44'),
		paddingInline: space('x16'),
		borderBlockEndStyle: 'solid',
		borderBlockEndColor: divider,
		borderBlockEndWidth: hairline,
	});

	// The row bleeds out of the padding by the room the focus ring of its buttons needs, so the ring is not clipped
	const inner = plain({
		render: 'div',
		display: 'flex',
		overflow: 'hidden',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexGrow: 1,
		height: percent(100),
		marginInline: offScale(-4),
		paddingInline: space('x4'),
		gap: space('x8'),
	});

	return [constant('headerFrame', header), constant('headerInnerFrame', inner)].join('\n\n');
};

const generateContent = () => {
	const content = plain({
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		overflowY: 'hidden',
		height: percent(100),
		paddingInline: space('x24'),
	});

	return [
		constant('contentFrame', textFrame(content)),
		// One table for both paddings: the compiler can't resolve two conditional props that both contribute a padding
		constant('contentPaddings', {
			'regular': {},
			'flush': { paddingInline: 0 },
			'spaced': { paddingBlock: space('x12') },
			'flush-spaced': { paddingInline: 0, paddingBlock: space('x12') },
		}),
	].join('\n\n');
};

const generateEmptyContent = () =>
	constant('emptyFrame', plain({ render: 'div', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }));

const generateSection = () =>
	constant(
		'sectionFrame',
		textFrame(
			plain({
				render: 'div',
				display: 'flex',
				alignItems: 'center',
				flexGrow: 1,
				padding: space('x16'),
				borderBlockEndStyle: 'solid',
				borderBlockEndColor: divider,
				borderBlockEndWidth: hairline,
			}),
		),
	);

const generateFooter = () =>
	constant('footerFrame', textFrame(plain({ render: 'div', display: 'block', paddingBlock: space('x20'), paddingInline: space('x16') })));

const generateTitle = () =>
	constant(
		'titleFrame',
		textFrame(
			plain({
				render: 'h5',
				display: 'block',
				margin: 0,
				padding: 0,
				...fontScale('h5'),
				flexGrow: 1,
				flexShrink: 1,
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
			}),
		),
	);

const generateSkeleton = () =>
	constant('skeletonFrame', plain({ render: 'div', display: 'flex', flexDirection: 'column', padding: space('x24'), gap: space('x4') }));

export default [
	{ file: component('Contextualbar.tsx'), generate: generateContextualbar },
	{ file: component('ContextualbarHeader.tsx'), generate: generateHeader },
	{ file: component('ContextualbarContent.tsx'), generate: generateContent },
	{ file: component('ContextualbarEmptyContent.tsx'), generate: generateEmptyContent },
	{ file: component('ContextualbarSection.tsx'), generate: generateSection },
	{ file: component('ContextualbarFooter.tsx'), generate: generateFooter },
	{ file: component('ContextualbarTitle.tsx'), generate: generateTitle },
	{ file: component('ContextualbarSkeletonContent.tsx'), generate: generateSkeleton },
] satisfies Target[];
