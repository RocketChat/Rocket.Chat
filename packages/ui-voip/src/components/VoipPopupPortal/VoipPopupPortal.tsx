import type { ReactElement, ReactNode } from 'react';
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { createAnchor } from '../../utils/createAnchor';
import { deleteAnchor } from '../../utils/deleteAnchor';

type VoipPopupPortalProps = {
	children?: ReactNode;
};

const VoipPopupPortal = ({ children }: VoipPopupPortalProps): ReactElement => {
	const [voipRoot] = useState(() => createAnchor('voip-root'));

	useEffect(() => (): void => deleteAnchor(voipRoot), [voipRoot]);

	return <>{createPortal(children, voipRoot)}</>;
};

export default memo(VoipPopupPortal);
