import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxFull, plainElement } from './sidebarStyles';
import { size } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const SidebarAccordionFrame = styled(View, {
	...boxFull,
	overflow: 'hidden',
	flexWrap: 'nowrap',
	justifyContent: 'stretch' as 'flex-start',
	height: size('full'),
});

const SidebarAccordionWrapper = styled(View, {
	...plainElement,
	overflow: 'scroll',
});

export type SidebarAccordionProps = HTMLAttributes<HTMLDivElement>;

const SidebarAccordion = ({ className, children, ...props }: SidebarAccordionProps) => (
	<SidebarAccordionFrame
		className={['rcx-sidebar-accordion rcx-box--animated', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof SidebarAccordionFrame>)}
	>
		<SidebarAccordionWrapper className='rcx-sidebar-accordion__wrapper'>{children}</SidebarAccordionWrapper>
	</SidebarAccordionFrame>
);

export default withFuselageProvider(SidebarAccordion);
