import { AnimatedVisibility, PositionAnimated } from '@rocket.chat/fuselage';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import type { Dispatch, RefObject, ReactElement, ReactNode, SetStateAction } from 'react';
import { cloneElement, useCallback, useId, useMemo, useRef } from 'react';

import InnerTooltip from './InnerTooltip';

export type AnchorParams = {
	ref: RefObject<Element | null>;
	toggle: Dispatch<SetStateAction<boolean>>;
	id: string;
};

const getAnchor = (children: ReactElement<any> | ((props: AnchorParams) => ReactNode), params: AnchorParams): ReactNode => {
	if (typeof children === 'function') {
		return children(params);
	}

	return cloneElement(children, {
		'ref': params.ref,
		'onMouseEnter': () => params.toggle(true),
		'onMouseLeave': () => params.toggle(false),
		'onFocus': () => params.toggle(true),
		'onBlur': () => params.toggle(false),
		'aria-describedby': params.id,
	});
};

export type TooltipWrapperProps = {
	children: ReactElement<any> | ((props: AnchorParams) => ReactNode);
	text: string;
};

const TooltipWrapper = ({ children, text }: TooltipWrapperProps) => {
	const anchorRef = useRef<Element>(null);
	const [open, setOpen] = useDebouncedState(false, 460);
	const toggle = useCallback(
		(open: SetStateAction<boolean>) => {
			setOpen(open);

			if (open) {
				setOpen.flush();
			}
		},
		[setOpen],
	);

	const id = useId();

	const anchorParams = useMemo(() => ({ ref: anchorRef, toggle, id }), [id, toggle]);
	const anchor = getAnchor(children, anchorParams);

	return (
		<>
			{anchor}

			{open && (
				<PositionAnimated anchor={anchorRef} placement='top-middle' margin={8} visible={AnimatedVisibility.UNHIDING}>
					<InnerTooltip id={id} aria-hidden='false' onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
						{text}
					</InnerTooltip>
				</PositionAnimated>
			)}
		</>
	);
};

export default TooltipWrapper;
