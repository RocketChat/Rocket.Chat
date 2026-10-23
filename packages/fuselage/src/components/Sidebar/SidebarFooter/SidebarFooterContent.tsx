import { styled, Text, type GetProps } from '@tamagui/web';

import { useTamaguiBoxProps } from '../../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../../types/ElementProps';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxFull, typography } from '../sidebarStyles';

const SidebarFooterContentFrame = styled(Text, {
	...boxFull,
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	...typography('micro'),
});

const SidebarFooterContentBase = ({ children, ...props }: ElementProps<HTMLDivElement>) => {
	const frameProps = useTamaguiBoxProps(props, 'rcx-sidebar-footer__content');

	return <SidebarFooterContentFrame {...(frameProps as GetProps<typeof SidebarFooterContentFrame>)}>{children}</SidebarFooterContentFrame>;
};

export const SidebarFooterContent = withFuselageProvider(SidebarFooterContentBase, { takesBoxTransforms: true });
