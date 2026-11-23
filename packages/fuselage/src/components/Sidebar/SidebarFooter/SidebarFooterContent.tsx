import { cx } from '../../../helpers/composeClassNames.js';
import type { ElementProps } from '../../../types/ElementProps.js';
import { Box } from '../../Box/index.js';

export const SidebarFooterContent = ({ children, className, ...props }: ElementProps<HTMLDivElement>) => (
	<Box {...props} className={cx('rcx-sidebar-footer__content', className)}>
		{children}
	</Box>
);
