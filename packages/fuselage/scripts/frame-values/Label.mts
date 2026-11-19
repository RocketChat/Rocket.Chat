import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, space, themed } from './lib/tokens.mts';

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
		color: themed('font-default'),
		...fontScale('p2m'),
	};

	const required = {
		render: 'span',
		display: 'inline',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginInlineStart: space('x4'),
		color: themed('font-danger'),
	};

	return [
		`const labelFrame = ${literal({ ...textFrameDefaults(frame), ...frame })} as const;`,
		`const labelDisabled = ${literal({ pointerEvents: 'none', color: themed('font-secondary-info') })} as const;`,
		// The label of a field aligns to the start of its column and keeps its own spacing
		`const labelInField = ${literal({ alignSelf: 'flex-start', marginBlock: offScale(2), marginInlineEnd: space('x8') })} as const;`,
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
		marginInline: space('x4'),
	};

	return `const labelInfoFrame = ${literal(frame)} as const;`;
};

export default [
	{ file: component('LabelBase.tsx'), generate: generateLabel },
	{ file: component('LabelInfo.tsx'), generate: generateLabelInfo },
] satisfies Target[];
