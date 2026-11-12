import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { strokeColors } from '../../src/Theme.ts';
import { borderRadius, borderWidth, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Pagination', file);

const generatePagination = () => {
	const nav = {
		render: 'nav',
		display: 'flex',
		flexDirection: { default: 'column-reverse', sm: 'column', md: 'row' },
		flexWrap: 'nowrap',
		alignItems: 'center',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		paddingBlock: spacing('x12')!,
		paddingInline: spacing('x24')!,
	};

	const dividers = { with: { position: 'relative' }, without: { position: 'static' } };

	const left = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginInlineStart: { default: 0, sm: 'auto', md: 0 },
		marginInlineEnd: { default: 0, md: 'auto' },
	};

	const right = {
		render: 'div',
		display: 'flex',
		flexDirection: { default: 'column', sm: 'row' },
		flexWrap: 'nowrap',
		alignItems: 'center',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginInlineStart: { default: 0, sm: 'auto' },
	};

	const labelFrame = {
		render: 'span',
		display: 'inline',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		color: textIconColor('font-annotation'),
		...font('c1'),
	};

	const list = {
		render: 'ol',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'center',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginInline: spacing('x4')!,
	};

	const item = {
		render: 'li',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginInline: offScale(2),
		padding: spacing('x4')!,
		color: textIconColor('font-secondary-info'),
		...font('c1'),
	};

	const button = {
		render: 'button',
		display: 'inline-flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		outlineStyle: 'none',
		backgroundColor: 'transparent',
	};

	const link = {
		...button,
		cursor: 'pointer',
		color: textIconColor('font-info'),
		...font('c1'),
	};

	const linkKinds = {
		page: { textDecorationLine: { hover: 'underline', focus: 'underline' } },
		current: { cursor: 'default', color: textIconColor('font-default'), ...font('c2') },
	};

	const step = {
		...button,
		color: textIconColor('font-secondary-info'),
		...font('c1'),
	};

	const stepKinds = { enabled: { cursor: 'pointer' }, disabled: { cursor: 'not-allowed' } };

	const text = (frame: Record<string, Value>) => literal({ ...textFrameDefaults(frame), ...frame });

	return [
		`const paginationFrame = ${literal(nav)} as const;`,
		`const paginationDividers = ${literal(dividers)} as const;`,
		`const paginationLeftFrame = ${literal(left)} as const;`,
		`const paginationRightFrame = ${literal(right)} as const;`,
		`const paginationLabelFrame = ${text(labelFrame)} as const;`,
		`const paginationListFrame = ${literal(list)} as const;`,
		`const paginationItemFrame = ${text(item)} as const;`,
		`const paginationLinkFrame = ${text(link)} as const;`,
		`const paginationLinkKinds = ${literal(linkKinds)} as const;`,
		`const paginationStepFrame = ${text(step)} as const;`,
		`const paginationStepKinds = ${literal(stepKinds)} as const;`,
	].join('\n\n');
};

const generateStylesheet = () => {
	const radius = themed('pagination-border-radius', borderRadius('small'));

	return `.rcx-pagination--divider::before {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;

	height: ${borderWidth('default')};

	content: '';

	border-radius: ${radius};
	background-color: ${strokeColors['stroke-extra-light'].toString()};
}`;
};

export default [
	{ file: component('Pagination.tsx'), generate: generatePagination },
	{ file: component('Pagination.styles.css'), generate: generateStylesheet, css: true },
] satisfies Target[];
