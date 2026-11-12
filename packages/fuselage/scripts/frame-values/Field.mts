import { join } from 'node:path';

import { font, textIconColor } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { spacing } from '../../src/styleTokens.ts';

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
		width: '100%',
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
		marginBlockStart: spacing('x4')!,
		marginBlockEnd: offScale(2),
		color: textIconColor('font-secondary-info'),
	};

	return [
		`const fieldRowFrame = ${literal(frame)} as const;`,
		`const fieldRowEnd = ${literal({ justifyContent: 'flex-end' })} as const;`,
	].join('\n\n');
};

// The text parts share a block, an inline box that is a flex item of the field
const textPart = (render: string, scale: 'p2' | 'c1', color: Parameters<typeof textIconColor>[0]) => {
	const frame = {
		render,
		display: 'inline',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginBlock: offScale(2),
		color: textIconColor(color),
		...font(scale),
	};

	return literal({ ...textFrameDefaults(frame), ...frame });
};

const generateDescription = () => `const fieldDescriptionFrame = ${textPart('span', 'p2', 'font-secondary-info')} as const;`;
const generateHint = () => `const fieldHintFrame = ${textPart('span', 'c1', 'font-secondary-info')} as const;`;
const generateError = () => `const fieldErrorFrame = ${textPart('span', 'c1', 'font-danger')} as const;`;
const generateLink = () => `const fieldLinkFrame = ${textPart('a', 'c1', 'font-info')} as const;`;

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
		gap: spacing('x24')!,
	};

	return `const fieldGroupFrame = ${literal(frame)} as const;`;
};

export default [
	{ file: component('Field/Field.tsx'), generate: generateField },
	{ file: component('Field/FieldRow.tsx'), generate: generateFieldRow },
	{ file: component('Field/FieldDescription.tsx'), generate: generateDescription },
	{ file: component('Field/FieldHint.tsx'), generate: generateHint },
	{ file: component('Field/FieldError.tsx'), generate: generateError },
	{ file: component('Field/FieldLink.tsx'), generate: generateLink },
	{ file: component('FieldGroup/FieldGroup.tsx'), generate: generateGroup },
] satisfies Target[];
