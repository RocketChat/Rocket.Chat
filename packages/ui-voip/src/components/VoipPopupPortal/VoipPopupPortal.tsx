import AnchorPortal from '@rocket.chat/ui-client/components/AnchorPortal';
import type { ReactElement, ReactNode } from 'react';
import { memo } from 'react';

const voipAnchorId = 'voip-root';

type VoipPopupPortalProps = {
	children?: ReactNode;
};

const VoipPopupPortal = ({ children }: VoipPopupPortalProps): ReactElement => {
	return <AnchorPortal id={voipAnchorId}>{children}</AnchorPortal>;
};

export default memo(VoipPopupPortal);
