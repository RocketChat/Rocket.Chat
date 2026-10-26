import { memo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarFooterProps = ElementProps<HTMLElement>;

function ContextualbarFooter(props: ContextualbarFooterProps) {
	return <Box rcx-vertical-bar__footer {...props} />;
}

export default memo(ContextualbarFooter);
