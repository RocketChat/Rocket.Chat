import type { ButtonGroupProps } from '../ButtonGroup/index.js';
import { ButtonGroup } from '../ButtonGroup/index.js';

export const SidebarButtonGroup = ({ align = 'end', small = true, ...props }: ButtonGroupProps) => (
	<ButtonGroup align={align} small={small} {...props} />
);
