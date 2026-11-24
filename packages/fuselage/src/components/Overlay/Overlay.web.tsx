import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { useOwnerDocument } from '../../contexts';

export type OverlayProps = {
	children: ReactNode;
	/** The element under `<body>` this overlay shares with the others of its kind. Without it the overlay sits on `<body>` itself. */
	containerId?: string;
};

const users = new WeakMap<HTMLElement, number>();
const createdHere = new WeakSet<HTMLElement>();

const findOrCreate = (ownerDocument: Document, containerId: string) => {
	const existing = ownerDocument.getElementById(containerId);
	if (existing) {
		return existing;
	}

	const element = ownerDocument.createElement('div');
	element.id = containerId;
	ownerDocument.body.appendChild(element);
	createdHere.add(element);
	return element;
};

const useSharedContainer = (ownerDocument: Document, containerId: string | undefined) => {
	// Resolved while rendering: the parent's own layout hooks need the portaled children mounted in the first commit.
	const container = useMemo(() => (containerId ? findOrCreate(ownerDocument, containerId) : undefined), [ownerDocument, containerId]);

	useEffect(() => {
		if (!container) {
			return;
		}

		// An overlay leaving in the same commit may have removed a container this one found while rendering.
		if (!container.isConnected) {
			container.ownerDocument.body.appendChild(container);
		}

		users.set(container, (users.get(container) ?? 0) + 1);

		return () => {
			const remaining = (users.get(container) ?? 1) - 1;
			users.set(container, remaining);

			if (remaining === 0 && createdHere.has(container)) {
				container.remove();
			}
		};
	}, [container]);

	return container;
};

/** Renders its children above the page, out of the layout and the clipping of the place it is declared in. */
const Overlay = ({ children, containerId }: OverlayProps) => {
	const { document: ownerDocument } = useOwnerDocument();
	const container = useSharedContainer(ownerDocument, containerId);

	return createPortal(children, container ?? ownerDocument.body);
};

export default Overlay;
