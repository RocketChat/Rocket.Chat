import type { ReactNode } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

const createModalRoot = (): HTMLElement => {
	const id = 'modal-root';
	const existing = document.getElementById(id);

	if (existing) return existing;

	const newOne = document.createElement('div');
	newOne.id = id;
	document.body.append(newOne);

	return newOne;
};

let modalRoot: HTMLElement | null = null;

type ModalPortalProps = {
	children?: ReactNode;
};

const ModalPortal = ({ children }: ModalPortalProps) => {
	if (!modalRoot) {
		modalRoot = createModalRoot();
	}

	return createPortal(children, modalRoot);
};

export default memo(ModalPortal);
