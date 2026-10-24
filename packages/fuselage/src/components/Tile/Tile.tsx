import { styled, Text, type GetProps } from '@tamagui/web';

import { shadowColors, surfaceColors, textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, fontFamily, fontScale } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const elevationBorder = {
	borderWidth: 1,
	borderStyle: 'solid',
	borderColor: String(shadowColors['shadow-elevation-border']),
} as const;

const TileFrame = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	flex: '0 1 auto',
	outline: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	color: String(textIconColors['font-default']),
	borderRadius: toCSSValue('--rcx-tile-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
	backgroundColor: String(surfaceColors['surface-light']),
	padding: 16,
	...(fontScale('p2') as { fontWeight: 400 }),

	variants: {
		elevation: {
			'0': {
				boxShadow: 'none',
			},
			'1': {
				boxShadow: `0 0 12px 0 ${shadowColors['shadow-elevation-1']}`,
				...elevationBorder,
			},
			'2': {
				boxShadow: `0 0 2px 0 ${shadowColors['shadow-elevation-2x']}, 0 0 12px 0 ${shadowColors['shadow-elevation-2y']}`,
				...elevationBorder,
			},
			'1nb': {},
			'2nb': {},
		},
		flush: {
			true: { padding: 0 },
		},
	} as const,
});

export type TileProps = ElementProps<HTMLElement> & {
	elevation?: BoxProps['elevation'];
	/** Drops the default padding, for a surface whose content brings its own. */
	flush?: boolean;
};

function Tile({ elevation = '1', flush, className, ...props }: TileProps) {
	return (
		<TileFrame
			elevation={elevation}
			flush={flush}
			{...(props as GetProps<typeof TileFrame>)}
			className={cx('rcx-tile', `rcx-tile--elevation-${elevation}`, className)}
		/>
	);
}

export default withFuselageProvider(Tile, { takesBoxTransforms: true });
