
import { createPortal } from 'react-dom';
import React, { useMemo, useEffect } from 'react';
import { Modal as ModalComponent, ModalBackdrop } from '@rocket.chat/fuselage';

const getModalRoot = () => {
	const modalRoot = document.getElementById('modal-root');
	if (modalRoot) {
		return modalRoot;
	}
	const newElement = document.createElement('div');

	newElement.id = 'modal-root';

	document.body.appendChild(newElement);
	return newElement;
};

function ModalPortal({ children = '' }) {
	const modalRoot = useMemo(getModalRoot, []);
	const node = useMemo(() => document.createElement('div'), []);

	useEffect(() => {
		modalRoot.appendChild(node);
		return () => modalRoot.removeChild(node);
	}, [node]);
	return createPortal(
		<div>{children}</div>,
		node,
	);
}

export function Modal({ ...props }) {
	return <ModalPortal>
		<ModalBackdrop>
			<ModalComponent {...props}/>
		</ModalBackdrop>
	</ModalPortal>;
}

Modal.Header = ModalComponent.Header;
Modal.Footer = ModalComponent.Footer;
Modal.Content = ModalComponent.Content;
Modal.Title = ModalComponent.Title;
Modal.Close = ModalComponent.Close;
