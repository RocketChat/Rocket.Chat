import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function createModalRoot(id: string): HTMLElement {
	const existing = document.getElementById(id);

	if (existing) return existing;

	const newOne = document.createElement('div');
	newOne.id = id;
	document.body.append(newOne);

	return newOne;
}

type ModalPortalProps = {
	children?: ReactNode;
};

const ModalPortal = ({ children }: ModalPortalProps) => {
	const id = `modal-root-${useUniqueId()}`;
	const modalRootRef = useRef<HTMLElement | null>(null);

	useEffect(
		() => () => {
			if (!modalRootRef.current) return;

			modalRootRef.current.remove();
			modalRootRef.current = null;
		},
		[id],
	);

	if (!modalRootRef.current) {
		modalRootRef.current = createModalRoot(id);
	}

	return createPortal(children, modalRootRef.current);
};

export default memo(ModalPortal);
