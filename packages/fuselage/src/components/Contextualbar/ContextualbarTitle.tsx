import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type ContextualbarTitleProps = ElementProps<HTMLHeadingElement>;

const ContextualbarTitle = (props: ContextualbarTitleProps) => <Box rcx-vertical-bar__title is='h5' {...props} />;

export default ContextualbarTitle;
