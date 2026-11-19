import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarFooterProps = ElementProps<HTMLElement>;

/** Bottom area of the bar, for the actions that confirm or cancel what the bar edits. */
function ContextualbarFooter(props: ContextualbarFooterProps) {
	return <Box rcx-vertical-bar__footer {...props} />;
}

export default ContextualbarFooter;
