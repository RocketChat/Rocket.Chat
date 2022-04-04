import { memo, ReactElement, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';

const getModalRoot = (): Element => {
	const modalRoot = document.getElementById('modal-root');
	if (modalRoot) {
		return modalRoot;
	}
	const newElement = document.createElement('div');

	newElement.id = 'modal-root';

	document.body.appendChild(newElement);
	return newElement;
};

type ModalPortalProps = {
	children?: ReactNode;
};

const ModalPortal = ({ children }: ModalPortalProps): ReactElement => {
	const [modalRoot] = useState(getModalRoot);
	return createPortal(children, modalRoot);
};

export default memo(ModalPortal);
