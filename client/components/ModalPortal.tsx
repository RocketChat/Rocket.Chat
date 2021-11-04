import { FC, memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { createAnchor } from '../lib/utils/createAnchor';
import { deleteAnchor } from '../lib/utils/deleteAnchor';

const ModalPortal: FC = ({ children }) => {
	const [modalRoot] = useState(() => createAnchor('modal-root'));
	useEffect(() => (): void => deleteAnchor(modalRoot), [modalRoot]);
	return createPortal(children, modalRoot);
};

export default memo<typeof ModalPortal>(ModalPortal);
