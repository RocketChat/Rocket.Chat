import { memo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarTitleProps = ElementProps<HTMLHeadingElement>;

const ContextualbarTitle = (props: ContextualbarTitleProps) => (
	<Box rcx-vertical-bar__title is='h5' {...props} />
);

export default memo(ContextualbarTitle);
