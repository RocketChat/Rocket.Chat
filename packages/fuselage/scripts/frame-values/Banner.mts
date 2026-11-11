import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import { statusPalettes, statusTones } from './lib/statusPalettes.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { strokeColors, surfaceColors } from '../../src/Theme.ts';
import { borderWidth, fontFamily, spacing } from '../../src/styleTokens.ts';

const generateBanner = () => {
	const palettes = statusPalettes();
	const color = (tone: (typeof statusTones)[number]) => themed(`banner-colors-${tone}-color`, palettes[tone].font);

	const frame = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 'auto',
		minWidth: 'auto',
		minHeight: 'auto',
		boxSizing: 'border-box',
		paddingBlock: offScale(14),
		paddingInline: spacing('x16')!,
		color: themed('banner-colors-neutral-color', textIconColor('font-default')),
		borderTopWidth: borderWidth('large'),
		borderTopStyle: 'solid',
		borderBottomWidth: borderWidth('default'),
		borderBottomStyle: 'solid',
		borderBottomColor: strokeColors['stroke-extra-light'].toString(),
		backgroundColor: themed('banner-colors-neutral-background-color', surfaceColors['surface-tint'].toString()),
		fontFamily: fontFamily('sans'),
	};

	const tones = {
		neutral: { borderTopColor: 'transparent' },
		...Object.fromEntries(statusTones.map((tone) => [tone, { borderTopColor: color(tone) }])),
	};

	// What a plain `div` does where a frame's defaults are a column's: it fills its parent and shrinks with it
	const block = {
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexBasis: 'auto',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
	};

	const icon = { render: 'div', ...block, paddingBlock: spacing('x8')!, paddingInlineEnd: spacing('x12')! };
	const iconTones = {
		neutral: {},
		...Object.fromEntries(statusTones.map((tone) => [tone, { color: color(tone) }])),
	};

	const content = { ...block, flexGrow: 1, alignSelf: 'center', ...font('p2') };
	const contentInline = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

	const title = { render: 'h6', ...block, margin: 0, padding: 0, ...font('h5') };
	const titleInline = { display: 'inline', paddingInlineEnd: spacing('x8')! };

	const link = { render: 'a', ...block, display: 'inline', paddingLeft: offScale(10) };

	const closeButton = { render: 'div', ...block, paddingBlock: offScale(6), paddingInline: spacing('x8')! };
	const closeButtonInline = { marginBlock: spacing('-x4')!, paddingBlock: 0 };

	return [
		`const bannerFrame = ${literal(frame)} as const;`,
		`const bannerTones = ${literal(tones)} as const;`,
		`const bannerInline = ${literal({ paddingBlock: spacing('x12')! })} as const;`,
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

export default [{ file: join(import.meta.dirname, '../../src/components/Banner/Banner.tsx'), generate: generateBanner }] satisfies Target[];
