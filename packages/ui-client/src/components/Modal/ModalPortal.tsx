import { useOwnerDocument } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

const createModalRoot = (ownerDocument: Document): HTMLElement => {
	const id = 'modal-root';
	const existing = ownerDocument.getElementById(id);

	if (existing) return existing;

	const newOne = ownerDocument.createElement('div');
	newOne.id = id;
	ownerDocument.body.append(newOne);

	return newOne;
};

type ModalPortalProps = {
	children?: ReactNode;
};

const modalRoots = new WeakMap<Document, HTMLElement>();

const ModalPortal = ({ children }: ModalPortalProps) => {
	const { document: ownerDocument } = useOwnerDocument();

	let modalRoot = modalRoots.get(ownerDocument);
	if (!modalRoot) {
		modalRoot = createModalRoot(ownerDocument);
		modalRoots.set(ownerDocument, modalRoot);
	}

	return createPortal(children, modalRoot);
};

export default memo(ModalPortal);
