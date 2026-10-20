import { styled, View, type GetProps } from '@tamagui/web';
import { createContext, useMemo } from 'react';

import { strokeColors } from '../../Theme';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderWidth, fontFamily, spacing } from '../../styleTokens';
import type { BoxProps } from '../Box';
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

/** Whether the tabs sit on a divider, which their underlines overlap. */
export const TabsContext = createContext({ divider: false });

export type TabsProps = BoxProps & { divider?: boolean };

/**
 * Tabs is a component to navigate around the UI using buttons arranged together with the selected tab highlighted.
 */
function Tabs({ children, divider = true, ...props }: TabsProps) {
	const tabsProps = useTamaguiBoxProps({ 'is': 'div', 'rcx-tabs': true, 'rcx-tabs--with-divider': divider, ...props });

	const context = useMemo(() => ({ divider }), [divider]);

	return (
		<TabsContext.Provider value={context}>
			<TabsFrame divider={divider} {...(tabsProps as GetProps<typeof TabsFrame>)}>
				<TabsScrollBox className='rcx-tabs__scroll-box'>
					<TabsWrapper className='rcx-tabs__wrapper' role='tablist'>
						{children}
					</TabsWrapper>
				</TabsScrollBox>
			</TabsFrame>
		</TabsContext.Provider>
	);
}

export default withFuselageProvider(Tabs, { takesBoxTransforms: true });
