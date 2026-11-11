import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, spacing } from '../../src/styleTokens.ts';

const components = join(import.meta.dirname, '../../src/components');

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

// The box a list of options is placed in: the width is the only thing it brings, through a custom property
const root = webDefaults({
	render: 'div',
	display: 'block',
	width: 'var(--rcx-options-width, auto)',
});

const list = (tag: 'ol' | 'ul') =>
	webDefaults({
		render: tag,
		display: 'block',
		position: 'relative',
		overflowY: 'auto',
		maxHeight: 'var(--rcx-options-max-height, 144px)',
		borderRadius: borderRadius('medium'),
		backgroundColor: surfaceColors['surface-light'].toString(),
		scrollBehavior: 'smooth',
	});

const generateOptions = () => [constant('optionsFrame', root), constant('optionsListFrame', list('ol'))].join('\n\n');

const generateOptionContainer = () =>
	[
		constant('optionContainerFrame', root),
		constant('optionContainerListFrame', { ...list('ol'), maxHeight: 'var(--rcx-options-max-height, 240px)' }),
	].join('\n\n');

const generateOptionsPaginated = () => constant('optionsPaginatedFrame', root);

const generateListbox = () => constant('listboxFrame', webDefaults({ render: 'ul', display: 'block', margin: 0, padding: 0 }));

const generateOptionDescriptionBlock = () => {
	const frame = webDefaults({
		render: 'div',
		display: 'block',
		padding: spacing('x4')!,
		whiteSpace: 'normal',
		wordBreak: 'break-word',
		color: textIconColor('font-secondary-info'),
		...font('p2'),
	});

	return constant('optionDescriptionBlockFrame', { ...textFrameDefaults(frame), ...frame });
};

// Pseudo-elements on the part's own element: the scrollbar of the list
const generateOptionsStyles = () => `@property --rcx-options-width {
	inherits: false;
	syntax: '*';
}

@property --rcx-options-max-height {
	inherits: false;
	syntax: '*';
}

.rcx-options__list::-webkit-scrollbar {
	width: ${spacing('x4')};
	height: ${spacing('x4')};
}

.rcx-options__list::-webkit-scrollbar-track {
	background-color: transparent;
}

.rcx-options__list::-webkit-scrollbar-thumb {
	background-color: ${themed('theme-scrollbar-thumb-color', 'rgba(0, 0, 0, 0.05)')};
}

.rcx-options__list:hover::-webkit-scrollbar-thumb {
	background-color: ${themed('theme-scrollbar-thumb-hover-color', 'rgba(0, 0, 0, 0.15)')};
}`;

// Single-class rule on the non-frame icon an option renders: it takes the color of its row, tone included
const generateOptionStyles = () => `.rcx-option__icon {
	color: inherit;
}`;

const targets: Target[] = [
	{ file: join(components, 'Options/Options.tsx'), generate: generateOptions },
	{ file: join(components, 'Options/OptionContainer.tsx'), generate: generateOptionContainer },
	{ file: join(components, 'Options/Options.styles.css'), generate: generateOptionsStyles, css: true },
	{ file: join(components, 'OptionsPaginated/OptionsPaginated.tsx'), generate: generateOptionsPaginated },
	{ file: join(components, 'Listbox/Listbox.tsx'), generate: generateListbox },
	{ file: join(components, 'Option/OptionDescriptionBlock.tsx'), generate: generateOptionDescriptionBlock },
	{ file: join(components, 'Option/Option.styles.css'), generate: generateOptionStyles, css: true },
];

export default targets;
