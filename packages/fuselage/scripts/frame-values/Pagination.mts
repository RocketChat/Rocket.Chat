import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, space, themed } from './lib/tokens.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Pagination', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const text = (frame: Record<string, Value>) => ({ ...textFrameDefaults(frame), ...frame, ...fontScale('c1') });

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
		paddingBlock: space('x12'),
		paddingInline: space('x24'),
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

	const label = {
		render: 'span',
		display: 'inline',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		color: themed('font-annotation'),
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
		marginInline: space('x4'),
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
		padding: space('x4'),
		color: themed('font-secondary-info'),
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

	const link = { ...button, cursor: 'pointer', color: themed('font-info') };

	const linkKinds = {
		page: { textDecorationLine: { default: 'none', hover: 'underline', focus: 'underline' } },
		current: { cursor: 'default', color: themed('font-default'), ...fontScale('c2') },
	};

	const step = { ...button, color: themed('font-secondary-info') };

	const stepKinds = { enabled: { cursor: 'pointer' }, disabled: { cursor: 'not-allowed' } };

	return [
		constant('paginationFrame', nav),
		constant('paginationDividers', dividers),
		constant('paginationLeftFrame', left),
		constant('paginationRightFrame', right),
		constant('paginationLabelFrame', text(label)),
		constant('paginationListFrame', list),
		constant('paginationItemFrame', text(item)),
		constant('paginationLinkFrame', text(link)),
		constant('paginationLinkKinds', linkKinds),
		constant('paginationStepFrame', text(step)),
		constant('paginationStepKinds', stepKinds),
	].join('\n\n');
};

export default [{ file: component('Pagination.tsx'), generate: generatePagination }] satisfies Target[];
