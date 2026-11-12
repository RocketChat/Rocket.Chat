import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type ContextualbarHeaderProps = ElementProps<HTMLDivElement>;

const ContextualbarHeader = ({ children, ...props }: ContextualbarHeaderProps) => (
	<Box rcx-vertical-bar__header {...props}>
		<Box rcx-vertical-bar__header-inner>{children}</Box>
	</Box>
);

export default ContextualbarHeader;
