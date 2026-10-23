import { styled, Text, type GetProps } from '@tamagui/web';

import { shadowColors, surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useArrayLikeClassNameProp } from '../../hooks/useArrayLikeClassNameProp';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, fontFamily, fontScale } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { BoxTransforms, useBoxTransform } from '../Box/BoxTransforms';
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
	} as const,
});

export type TileProps = ElementProps<HTMLElement> & {
	elevation?: BoxProps['elevation'];
	/** Drops the default padding, for a surface whose content brings its own. */
	flush?: boolean;
};

function Tile({ elevation = '1', flush, ...props }: TileProps) {
	const transformFn = useBoxTransform();
	const boxProps = useArrayLikeClassNameProp({ padding: flush ? undefined : 16, ...props });
	const frameProps = useTamaguiBoxProps(transformFn ? transformFn(boxProps) : boxProps, `rcx-tile rcx-tile--elevation-${elevation}`);
	const element = <TileFrame elevation={elevation} {...(frameProps as GetProps<typeof TileFrame>)} />;

	if (transformFn) {
		return <BoxTransforms.Provider value={null}>{element}</BoxTransforms.Provider>;
	}

	return element;
}

export default withFuselageProvider(Tile);
