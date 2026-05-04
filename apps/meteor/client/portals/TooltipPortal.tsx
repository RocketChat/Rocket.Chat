import { AnchorPortal } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { memo } from 'react';

export const TOOLTIP_PORTAL_ROOT_ID = 'tooltip-root';

type TooltipPortalProps = {
	children?: ReactNode;
};

const TooltipPortal = ({ children }: TooltipPortalProps) => {
	return <AnchorPortal id={TOOLTIP_PORTAL_ROOT_ID}>{children}</AnchorPortal>;
};

export default memo(TooltipPortal);
