import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale, percent, space, themed } from './lib/tokens.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components', file);

const generateField = () => {
	const frame = {
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		flexWrap: 'nowrap',
		alignItems: 'stretch',
		flexShrink: 0,
		minWidth: 'auto',
		minHeight: 'auto',
		width: percent(100),
	};

	return `const fieldFrame = ${literal(frame)} as const;`;
};

const generateFieldRow = () => {
	const frame = {
		render: 'span',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginBlockStart: space('x4'),
		marginBlockEnd: offScale(2),
		color: themed('font-secondary-info'),
	};

	return [
		`const fieldRowFrame = ${literal(frame)} as const;`,
		`const fieldRowEnd = ${literal({ justifyContent: 'flex-end' })} as const;`,
	].join('\n\n');
};

// The text parts share a box: an inline one that is a flex item of the field
const textPart = (render: string, color: Parameters<typeof themed>[0]) => {
	const frame = {
		render,
		display: 'inline',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginBlock: offScale(2),
		color: themed(color),
	};

	return literal({ ...textFrameDefaults(frame), ...frame });
};

const generateGroup = () => {
	const frame = {
		render: 'fieldset',
		display: 'flex',
		flexDirection: 'column',
		flexWrap: 'nowrap',
		justifyContent: 'center',
		alignItems: 'stretch',
		flexShrink: 1,
		minWidth: 0,
		minHeight: 'auto',
		gap: space('x24'),
	};

	return `const fieldGroupFrame = ${literal(frame)} as const;`;
};

const text = (name: string, render: string, color: Parameters<typeof themed>[0]) => () =>
	`const ${name} = ${textPart(render, color)} as const;`;

export default [
	{ file: component('Field/Field.tsx'), generate: generateField },
	{ file: component('Field/FieldRow.tsx'), generate: generateFieldRow },
	{ file: component('Field/FieldDescription.tsx'), generate: text('fieldDescriptionFrame', 'span', 'font-secondary-info') },
	{ file: component('Field/FieldHint.tsx'), generate: text('fieldHintFrame', 'span', 'font-secondary-info') },
	{ file: component('Field/FieldError.tsx'), generate: text('fieldErrorFrame', 'span', 'font-danger') },
	{ file: component('Field/FieldLink.tsx'), generate: text('fieldLinkFrame', 'a', 'font-info') },
	{ file: component('FieldGroup/FieldGroup.tsx'), generate: generateGroup },
] satisfies Target[];
