import { memo, useEffect, ReactElement, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';

import { createAnchor } from '../../lib/utils/createAnchor';
import { deleteAnchor } from '../../lib/utils/deleteAnchor';

type ModalPortalProps = {
	children?: ReactNode;
};

const ModalPortal = ({ children }: ModalPortalProps): ReactElement => {
	const [modalRoot] = useState(() => createAnchor('modal-root'));
	useEffect(() => (): void => deleteAnchor(modalRoot), [modalRoot]);
	return createPortal(children, modalRoot);
};

export default memo(ModalPortal);
