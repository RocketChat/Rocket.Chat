import type { ReactNode } from 'react';
import { memo } from 'react';

import AnchorPortal from './AnchorPortal';

const tooltipAnchorId = 'tooltip-root';

type TooltipPortalProps = {
	children?: ReactNode;
};

const TooltipPortal = ({ children }: TooltipPortalProps) => {
	return <AnchorPortal id={tooltipAnchorId}>{children}</AnchorPortal>;
};

export default memo(TooltipPortal);
