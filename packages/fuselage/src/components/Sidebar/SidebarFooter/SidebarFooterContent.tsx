import type { ElementProps } from '../../../types/ElementProps';
import { Box } from '../../Box';

export const SidebarFooterContent = ({ children, ...props }: ElementProps<HTMLDivElement>) => (
	<Box className='rcx-sidebar-footer__content' {...props}>
		{children}
	</Box>
);
