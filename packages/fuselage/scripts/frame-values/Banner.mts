import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, space, themed } from './lib/tokens.mts';

const statusTones = ['info', 'success', 'warning', 'danger'] as const;

const generate = () => {
	const frame = {
		...boxDefaults,
		display: 'flex',
		flexWrap: 'nowrap',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingBlock: offScale(14),
		paddingInline: space('x16'),
		color: themed('font-default'),
		borderTopWidth: space('x4'),
		borderTopStyle: 'solid',
		borderBottomWidth: offScale(1),
		borderBottomStyle: 'solid',
		borderBottomColor: themed('stroke-extra-light'),
		backgroundColor: themed('surface-tint'),
	};

	const tones = {
		neutral: { borderTopColor: 'transparent' },
		...Object.fromEntries(statusTones.map((tone) => [tone, { borderTopColor: themed(`status-font-on-${tone}`) }])),
	};

	const block = { ...boxDefaults, display: 'block' };

	const icon = { ...block, paddingBlock: space('x8'), paddingInlineEnd: space('x12') };
	const iconTones = {
		neutral: {},
		...Object.fromEntries(statusTones.map((tone) => [tone, { color: themed(`status-font-on-${tone}`) }])),
	};

	const content = { ...block, ...fontScale('p2'), flexGrow: 1, alignSelf: 'center' };
	const contentInline = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

	const title = { render: 'h6', ...block, ...fontScale('h5'), margin: 0, padding: 0 };
	const titleInline = { display: 'inline', paddingInlineEnd: space('x8') };

	const link = { render: 'a', ...block, display: 'inline', paddingLeft: offScale(10) };

	const closeButton = { ...block, paddingBlock: offScale(6), paddingInline: space('x8') };
	const closeButtonInline = { marginBlock: offScale(-4), paddingBlock: 0 };

	return [
		`const bannerFrame = ${literal(frame)} as const;`,
		`const bannerTones = ${literal(tones)} as const;`,
		`const bannerInline = ${literal({ paddingBlock: space('x12') })} as const;`,
		`const bannerActionable = ${literal({ cursor: 'pointer' })} as const;`,
		`const bannerIcon = ${literal(icon)} as const;`,
		`const bannerIconTones = ${literal(iconTones)} as const;`,
		`const bannerContent = ${literal({ ...textFrameDefaults(content), ...content })} as const;`,
		`const bannerContentInline = ${literal(contentInline)} as const;`,
		`const bannerTitle = ${literal({ ...textFrameDefaults(title), ...title })} as const;`,
		`const bannerTitleInline = ${literal(titleInline)} as const;`,
		`const bannerLink = ${literal({ ...textFrameDefaults(link), ...link })} as const;`,
		`const bannerCloseButton = ${literal(closeButton)} as const;`,
		`const bannerCloseButtonInline = ${literal(closeButtonInline)} as const;`,
	].join('\n\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/Banner/Banner.tsx'), generate }] satisfies Target[];
