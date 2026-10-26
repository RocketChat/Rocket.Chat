import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { SidebarDivider } from './SidebarDivider';
import { boxFull } from './sidebarStyles';
import { prependClassName } from '../../helpers/prependClassName';
import { size, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const SidebarSectionFrame = styled(View, {
	...boxFull,
	flexDirection: 'row',
	alignItems: 'center',
	height: size('x44'),
	paddingInline: spacing('x16'),
	gap: spacing('x8'),
});

const SidebarSectionBase = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div>
		<SidebarSectionFrame
			className={prependClassName(className, 'rcx-sidebar-section')}
			{...(props as GetProps<typeof SidebarSectionFrame>)}
		/>
		<SidebarDivider />
	</div>
);

export const SidebarSection = withFuselageProvider(SidebarSectionBase);
