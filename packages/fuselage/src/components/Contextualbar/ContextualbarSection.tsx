import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarSectionProps = ElementProps<HTMLElement>;

/** A row under the header for controls that act on the content, such as a search input. */
function ContextualbarSection(props: ContextualbarSectionProps) {
	return <Box rcx-vertical-bar__section {...props} />;
}

export default ContextualbarSection;
