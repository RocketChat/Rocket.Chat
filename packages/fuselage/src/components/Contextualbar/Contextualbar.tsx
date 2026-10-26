import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarProps = ElementProps<HTMLElement> & {
	/** Makes the bar as wide as its container, as when it is positioned over the room. */
	stretch?: boolean;
	/** How the bar is placed: in the flow beside the room, or over it. */
	position?: 'static' | 'relative' | 'absolute' | 'fixed';
};

/**
 * The `Contextualbar` has the purpose to persist and input information about the scope of the related page.
 */
function Contextualbar({ stretch, position, ...props }: ContextualbarProps) {
	return (
		<Box rcx-vertical-bar rcx-vertical-bar--stretch={stretch} rcx-vertical-bar--position={position} {...props} />
	);
}

export default Contextualbar;
