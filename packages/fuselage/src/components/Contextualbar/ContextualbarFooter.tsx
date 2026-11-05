import { memo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarFooterProps = ElementProps<HTMLElement>;

function ContextualbarFooter(props: ContextualbarFooterProps) {
	return <Box paddingInline={16} paddingBlock={20} {...props} />;
}

export default memo(ContextualbarFooter);
