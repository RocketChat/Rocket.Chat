import { memo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarTitleProps = ElementProps<HTMLHeadingElement>;

const ContextualbarTitle = (props: ContextualbarTitleProps) => (
	<Box flexShrink={1} flexGrow={1} fontScale='h5' withTruncatedText is='h5' {...props} />
);

export default memo(ContextualbarTitle);
