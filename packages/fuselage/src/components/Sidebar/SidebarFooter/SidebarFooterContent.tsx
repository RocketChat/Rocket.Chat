import { styled, Text, type GetProps } from '@tamagui/web';

import { cx } from '../../../helpers/composeClassNames';
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

const SidebarFooterContentBase = ({ className, ...props }: ElementProps<HTMLDivElement>) => (
	<SidebarFooterContentFrame
		{...(props as GetProps<typeof SidebarFooterContentFrame>)}
		className={cx('rcx-sidebar-footer__content', className)}
	/>
);

export const SidebarFooterContent = withFuselageProvider(SidebarFooterContentBase);
