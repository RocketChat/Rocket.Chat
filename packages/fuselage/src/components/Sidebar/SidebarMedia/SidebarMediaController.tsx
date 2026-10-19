import { styled, Text, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { SidebarButtonGroup } from '../SidebarButtonGroup';
import { plainElement, typography } from '../sidebarStyles';

const SidebarMediaControllerFrame = styled(View, {
	...plainElement,
	flexDirection: 'row',
	justifyContent: 'space-between',
	alignItems: 'center',
	paddingInline: spacing('x16'),
});

const SidebarMediaControllerLabel = styled(Text, {
	render: 'div',
	...plainElement,
	display: 'block',
	whiteSpace: 'inherit',
	...typography('p2'),
});

const SidebarMediaControllerBase = ({ className, label, children, ...props }: { label?: string } & HTMLAttributes<HTMLDivElement>) => (
	<SidebarMediaControllerFrame className={['rcx-sidebar-media__controller', className].filter(Boolean).join(' ')}>
		<SidebarMediaControllerLabel className='rcx-sidebar-media__controller__label'>{label}</SidebarMediaControllerLabel>
		<SidebarButtonGroup small align='end' {...props}>
			{children}
		</SidebarButtonGroup>
	</SidebarMediaControllerFrame>
);

export const SidebarMediaController = withFuselageProvider(SidebarMediaControllerBase);
