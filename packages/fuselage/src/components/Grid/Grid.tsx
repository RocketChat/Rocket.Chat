import { styled, View, type GetProps } from '@tamagui/web';
import { useMemo } from 'react';

import GridItem, { gridBoxStyle, GridContext, gutter } from './GridItem';
import { cx } from '../../helpers/composeClassNames';
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

const Grid = ({ xs, sm, md, lg, xl, className, ...props }: GridProps) => {
	const pinned = useMemo(() => ({ xs, sm, md, lg, xl }), [xs, sm, md, lg, xl]);

	return (
		<GridContext.Provider value={pinned}>
			<GridWrapper className='rcx-grid__wrapper'>
				<GridFrame
					{...(props as GetProps<typeof GridFrame>)}
					className={cx(
						'rcx-grid',
						xs && 'rcx-grid--xs',
						sm && 'rcx-grid--sm',
						md && 'rcx-grid--md',
						lg && 'rcx-grid--lg',
						xl && 'rcx-grid--xl',
						className,
					)}
				/>
			</GridWrapper>
		</GridContext.Provider>
	);
};

export default Object.assign(withFuselageProvider(Grid), { Item: GridItem });
