import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import { useBorderBoxSize, usePosition, usePreventScrollOutside } from '@rocket.chat/fuselage-hooks';
import type { RefObject, ReactElement } from 'react';
import { useRef, useMemo, cloneElement } from 'react';

import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import { Overlay } from '../Overlay';

export type PositionProps = Omit<ElementProps<HTMLElement>, 'children'> & {
	anchor: RefObject<Element | null>;
	children: ReactElement<any>;
	margin?: number;
	placement?: UsePositionOptions['placement'];
	/** Holds the page still while the element is shown, so it cannot drift away from its anchor; it keeps scrolling itself. */
	preventScroll?: boolean;
	/** Gives the element the width of its anchor, and keeps it as the anchor resizes. */
	width?: 'anchor';
};

const unmeasured = { current: null };

const Position = ({ anchor, children, placement, margin, preventScroll = false, width, className, ...props }: PositionProps) => {
	const target = useRef<Element>(null);
	const { inlineSize } = useBorderBoxSize(width === 'anchor' ? (anchor as RefObject<HTMLElement | null>) : unmeasured);
	const { style: positionStyle, placement: positionPlacement } =
		usePosition(
			anchor,
			target,
			useMemo(() => ({ placement, margin }), [placement, margin]),
		) || {};

	usePreventScrollOutside(target, preventScroll);

	const style = useMemo(
		() => ({ position: 'fixed', ...positionStyle, ...(width === 'anchor' && { width: inlineSize }) }),
		[positionStyle, width, inlineSize],
	);

	return (
		<Overlay containerId='position-container'>
			{cloneElement(children, {
				ref: target,
				style: { ...children.props.style, ...style },
				...props,
				className: cx(children.props.className, className) || undefined,
				placement: positionPlacement,
			})}
		</Overlay>
	);
};

export default Position;
