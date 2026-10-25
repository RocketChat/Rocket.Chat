import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import { usePosition, usePreventScrollOutside } from '@rocket.chat/fuselage-hooks';
import type { RefObject, ReactElement } from 'react';
import { useRef, useMemo, cloneElement, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useOwnerDocument } from '../../contexts';
import type { ElementProps } from '../../types/ElementProps';

export type PositionProps = Omit<ElementProps<HTMLElement>, 'children'> & {
	anchor: RefObject<Element | null>;
	children: ReactElement<any>;
	margin?: number;
	placement?: UsePositionOptions['placement'];
	/** Holds the page still while the element is shown, so it cannot drift away from its anchor; it keeps scrolling itself. */
	preventScroll?: boolean;
};

const Position = ({ anchor, children, placement, margin, preventScroll = false, className: _className, ...props }: PositionProps) => {
	const target = useRef<Element>(null);
	const { style: positionStyle, placement: positionPlacement } =
		usePosition(
			anchor,
			target,
			useMemo(() => ({ placement, margin }), [placement, margin]),
		) || {};

	usePreventScrollOutside(target, preventScroll);

	const style = useMemo(() => ({ position: 'fixed', ...positionStyle }), [positionStyle]);

	const { document: ownerDocument } = useOwnerDocument();

	const [portalContainer] = useState(() => {
		const prev = ownerDocument.getElementById('position-container');
		if (prev) {
			return prev;
		}
		const element = ownerDocument.createElement('div');

		element.id = 'position-container';

		ownerDocument.body.appendChild(element);
		return element;
	});

	useEffect(
		() => () => {
			if (portalContainer.childNodes.length === 0) {
				ownerDocument.body.removeChild(portalContainer);
			}
		},
		[portalContainer, ownerDocument],
	);

	return createPortal(
		cloneElement(children, {
			ref: target,
			style: { ...children.props.style, ...style },
			...props,
			placement: positionPlacement,
		}),
		portalContainer,
	);
};

export default Position;
