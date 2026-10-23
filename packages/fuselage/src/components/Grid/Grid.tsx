import { styled, View, type GetProps } from '@tamagui/web';
import { useMemo } from 'react';

import GridItem, { gridBoxStyle, GridContext, gutter } from './GridItem';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
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
	marginBlock: { default: gutter('xs', -1 / 2), sm: gutter('sm', -1 / 2), md: gutter('md', -1 / 2) },
	marginInline: { default: gutter('xs', -1 / 2), sm: gutter('sm', -1 / 2), md: gutter('md', -1 / 2) },
});

export type GridProps = ElementProps<HTMLDivElement> & {
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

	const pinned = useMemo(() => ({ xs, sm, md, lg, xl }), [xs, sm, md, lg, xl]);

	return (
		<GridContext.Provider value={pinned}>
			<GridWrapper className='rcx-grid__wrapper'>
				<GridFrame {...(gridProps as GetProps<typeof GridFrame>)} />
			</GridWrapper>
		</GridContext.Provider>
	);
};

export default Object.assign(withFuselageProvider(Grid, { takesBoxTransforms: true }), { Item: GridItem });
