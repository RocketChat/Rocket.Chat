import { styled, View, type GetProps } from '@tamagui/web';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import GridItem, { gridBoxStyle } from './GridItem';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const GridWrapper = styled(View, {
	...gridBoxStyle,
	display: 'block',
	overflow: 'hidden',
});

const GridFrame = styled(View, {
	...gridBoxStyle,
	flexDirection: 'row',
	flexWrap: 'wrap',
	flexShrink: 1,
});

export type GridProps = BoxProps & {
	xs?: boolean;
	sm?: boolean;
	md?: boolean;
	lg?: boolean;
	xl?: boolean;
};

const Grid = ({ xs, sm, md, lg, xl, ...props }: GridProps) => {
	const gridProps = useTamaguiBoxProps({
		'rcx-grid': true,
		'rcx-grid--xs': xs,
		'rcx-grid--sm': sm,
		'rcx-grid--md': md,
		'rcx-grid--lg': lg,
		'rcx-grid--xl': xl,
		...props,
	});

	return (
		<GridWrapper className='rcx-grid__wrapper'>
			<GridFrame {...(gridProps as GetProps<typeof GridFrame>)} />
		</GridWrapper>
	);
};

export default Object.assign(withFuselageProvider(Grid, { takesBoxTransforms: true }), { Item: GridItem });
