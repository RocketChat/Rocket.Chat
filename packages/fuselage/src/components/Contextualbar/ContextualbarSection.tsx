import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarSectionProps = ElementProps<HTMLElement>;

function ContextualbarSection(props: ContextualbarSectionProps) {
	return (
		<Box rcx-vertical-bar__section {...props} />
	);
}

export default ContextualbarSection;
