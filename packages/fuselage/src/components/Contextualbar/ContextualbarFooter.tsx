import type { RefAttributes } from 'react';
import { memo } from 'react';

import { Box, type BoxProps } from '../Box';

export type ContextualbarFooterProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLElement>;

function ContextualbarFooter(props: ContextualbarFooterProps) {
	return <Box paddingInline={16} paddingBlock={20} {...props} />;
}

export default memo(ContextualbarFooter);
