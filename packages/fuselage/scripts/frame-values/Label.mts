import { join } from 'node:path';

import { font, textIconColor } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Label', file);

const generateLabel = () => {
	const frame = {
		render: 'label',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		cursor: 'default',
		color: textIconColor('font-default'),
		...font('p2m'),
	};

	const required = {
		render: 'span',
		display: 'inline',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginInlineStart: spacing('x4')!,
		color: textIconColor('font-danger'),
	};

	const states = { disabled: { pointerEvents: 'none', color: textIconColor('font-secondary-info') } };

	// The label of a Field aligns to the start of its column and keeps its own spacing
	const field = { alignSelf: 'flex-start', marginBlock: offScale(2), marginInlineEnd: spacing('x8')! };

	return [
		`const labelFrame = ${literal({ ...textFrameDefaults(frame), ...frame })} as const;`,
		`const labelDisabled = ${literal(states.disabled)} as const;`,
		`const labelInField = ${literal(field)} as const;`,
		`const labelRequired = ${literal({ ...textFrameDefaults(required), ...required })} as const;`,
	].join('\n\n');
};

const generateLabelInfo = () => {
	const frame = {
		render: 'span',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		order: 1,
		marginInline: spacing('x4')!,
	};

	return `const labelInfoFrame = ${literal(frame)} as const;`;
};

export default [
	{ file: component('LabelBase.tsx'), generate: generateLabel },
	{ file: component('LabelInfo.tsx'), generate: generateLabelInfo },
] satisfies Target[];
