import { cx } from '../../../helpers/composeClassNames';
import type { ElementProps } from '../../../types/ElementProps';
import { Box } from '../../Box';

export const SidebarFooterContent = ({ children, className, ...props }: ElementProps<HTMLDivElement>) => (
	<Box {...props} className={cx('rcx-sidebar-footer__content', className)}>
		{children}
	</Box>
);
