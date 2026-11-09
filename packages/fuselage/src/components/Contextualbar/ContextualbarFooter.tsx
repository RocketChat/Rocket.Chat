import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type ContextualbarFooterProps = ElementProps<HTMLElement>;

function ContextualbarFooter(props: ContextualbarFooterProps) {
	return <Box rcx-vertical-bar__footer {...props} />;
}

export default ContextualbarFooter;
