import type { ReactElement, ReactNode } from 'react';
import React, { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { createAnchor } from '../lib/utils/createAnchor';
import { deleteAnchor } from '../lib/utils/deleteAnchor';

type VoiceCallPortalProps = {
	children?: ReactNode;
};

const VoiceCallPortal = ({ children }: VoiceCallPortalProps): ReactElement => {
	const [voiceCallRoot] = useState(() => createAnchor('voice-call-root'));
	useEffect(() => (): void => deleteAnchor(voiceCallRoot), [voiceCallRoot]);
	return <>{createPortal(children, voiceCallRoot)}</>;
};

export default memo(VoiceCallPortal);
