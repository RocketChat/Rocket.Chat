import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarContentProps = ElementProps<HTMLElement> & {
	/** Drops the inline padding, for content such as a list whose items bring their own. */
	flush?: boolean;
	/** Adds a 12px block padding, so the first and last items keep clear of the header and footer. */
	spaced?: boolean;
};

function ContextualbarContent({ flush, spaced, ...props }: ContextualbarContentProps) {
	return <Box rcx-vertical-bar__content rcx-vertical-bar__content--flush={flush} rcx-vertical-bar__content--spaced={spaced} {...props} />;
}

export default ContextualbarContent;
