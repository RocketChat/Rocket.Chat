import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarTitleProps = ElementProps<HTMLHeadingElement>;

/** Title of the bar, cut short with an ellipsis when it doesn't fit. */
const ContextualbarTitle = (props: ContextualbarTitleProps) => <Box rcx-vertical-bar__title is='h5' {...props} />;

export default ContextualbarTitle;
