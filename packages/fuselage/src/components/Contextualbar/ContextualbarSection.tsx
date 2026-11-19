import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type ContextualbarSectionProps = ElementProps<HTMLElement>;

function ContextualbarSection(props: ContextualbarSectionProps) {
	return <Box rcx-vertical-bar__section {...props} />;
}

export default ContextualbarSection;
