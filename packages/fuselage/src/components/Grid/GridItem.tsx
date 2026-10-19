import { styled, View, type GetProps } from '@tamagui/web';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { fontFamily } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

/** What `rcx-box rcx-box--full` used to give every Grid element. */
export const gridBoxStyle = {
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
} as const;

const GridItemFrame = styled(View, {
	...gridBoxStyle,
	display: 'block',
	flexGrow: 1,
	flexBasis: 0,
});

export type GridItemProps = BoxProps & {
	xs?: 1 | 2 | 3 | 4;
	sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
	xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

const GridItem = ({ xs, sm, md, lg, xl, ...props }: GridItemProps) => {
	const itemProps = useTamaguiBoxProps({
		'rcx-grid__item': true,
		'rcx-grid__item--xs': xs,
		'rcx-grid__item--sm': sm,
		'rcx-grid__item--md': md,
		'rcx-grid__item--lg': lg,
		'rcx-grid__item--xl': xl,
		...props,
	});

	return <GridItemFrame {...(itemProps as GetProps<typeof GridItemFrame>)} />;
};

export default withFuselageProvider(GridItem);
