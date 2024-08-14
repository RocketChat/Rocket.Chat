import type { ReactElement, ReactNode } from 'react';
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { createAnchor } from '../../utils/createAnchor';
import { deleteAnchor } from '../../utils/deleteAnchor';

type VoipPopupPortalProps = {
	children?: ReactNode;
};

const VoipPopupPortal = ({ children }: VoipPopupPortalProps): ReactElement => {
	const [voiceCallRoot] = useState(() => createAnchor('voice-call-root'));

	useEffect(() => (): void => deleteAnchor(voiceCallRoot), [voiceCallRoot]);

	return <>{createPortal(children, voiceCallRoot)}</>;
};

export default memo(VoipPopupPortal);
