import { styled, View, type GetProps } from '@tamagui/web';
import { createContext, useMemo } from 'react';

import { strokeColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { borderWidth, fontFamily, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

/** What `rcx-box rcx-box--full` used to give every Tabs element. */
export const tabsBoxStyle = {
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
} as const;

const TabsFrame = styled(View, {
	...tabsBoxStyle,
	position: 'relative',
	flexDirection: 'row',

	variants: {
		divider: {
			true: {
				borderWidth: 0,
				borderBottomWidth: borderWidth('default'),
				borderStyle: 'solid',
				borderColor: String(strokeColors['stroke-light']),
			},
		},
		stretch: {
			true: { flexDirection: 'column' },
		},
	} as const,
});

const TabsScrollBox = styled(View, {
	...tabsBoxStyle,
	display: 'block',
	position: 'relative',
	overflow: 'auto',
	marginBlock: spacing('neg-x4'),
});

const TabsWrapper = styled(View, {
	...tabsBoxStyle,
	flexDirection: 'row',
	flexWrap: 'nowrap',
	marginBlock: 0,
	marginInline: spacing('x12'),
	paddingBlock: spacing('x4'),
	paddingInline: 0,
});

/** Whether the tabs sit on a divider, which their underlines overlap, and whether they fill the width. */
export const TabsContext = createContext({ divider: false, stretch: false });

export type TabsProps = ElementProps<HTMLDivElement> & {
	divider?: boolean;
	/** Grows the items to fill the whole width. */
	stretch?: boolean;
};

/**
 * Tabs is a component to navigate around the UI using buttons arranged together with the selected tab highlighted.
 */
function Tabs({ children, divider = true, stretch = false, className, ...props }: TabsProps) {
	const context = useMemo(() => ({ divider, stretch }), [divider, stretch]);

	return (
		<TabsContext.Provider value={context}>
			<TabsFrame
				divider={divider}
				stretch={stretch}
				{...(props as GetProps<typeof TabsFrame>)}
				className={cx('rcx-tabs', divider && 'rcx-tabs--with-divider', stretch && 'rcx-tabs--stretch', className)}
			>
				<TabsScrollBox className='rcx-tabs__scroll-box'>
					<TabsWrapper className='rcx-tabs__wrapper' role='tablist'>
						{children}
					</TabsWrapper>
				</TabsScrollBox>
			</TabsFrame>
		</TabsContext.Provider>
	);
}

export default withFuselageProvider(Tabs);
