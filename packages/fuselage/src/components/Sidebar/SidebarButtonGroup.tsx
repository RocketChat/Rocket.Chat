import type { ButtonGroupProps } from '../ButtonGroup';
import { ButtonGroup } from '../ButtonGroup';

export const SidebarButtonGroup = ({ align = 'end', small = true, ...props }: ButtonGroupProps) => (
	<ButtonGroup align={align} small={small} {...props} />
);
