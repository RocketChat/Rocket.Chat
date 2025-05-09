import { ReactNode, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

import { ensureAnchorElement, refAnchorElement, unrefAnchorElement } from '../helpers/anchors';

export type AnchorPortalProps = {
	id: string;
	children: ReactNode;
};

const AnchorPortal = ({ id, children }: AnchorPortalProps) => {
	const anchorElement = ensureAnchorElement(id);

	useLayoutEffect(() => {
		refAnchorElement(anchorElement);

		return () => {
			unrefAnchorElement(anchorElement);
		};
	}, [anchorElement]);

	return <>{createPortal(children, anchorElement)}</>;
};

export default AnchorPortal;
