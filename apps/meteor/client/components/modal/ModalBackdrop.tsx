import { Box } from '@rocket.chat/fuselage';
import React, { MouseEvent, ReactElement, ReactNode, RefObject, useCallback, useEffect, useRef } from 'react';

const useEscapeKey = (onDismiss: (() => void) | undefined): void => {
	useEffect(() => {
		const closeOnEsc = (e: KeyboardEvent): void => {
			if (e.key !== 'Escape') {
				return;
			}

			e.stopPropagation();
			onDismiss?.();
		};

		window.addEventListener('keydown', closeOnEsc);

		return (): void => {
			window.removeEventListener('keydown', closeOnEsc);
		};
	}, [onDismiss]);
};

const isAtBackdropChildren = (e: MouseEvent, ref: RefObject<HTMLElement>): boolean => {
	const backdrop = ref.current;
	const { parentElement } = e.target as HTMLElement;

	return (Boolean(parentElement) && backdrop?.contains(parentElement)) ?? false;
};

const useOutsideClick = (
	ref: RefObject<HTMLElement>,
	onDismiss: (() => void) | undefined,
): {
	onMouseDown: (e: MouseEvent) => void;
	onMouseUp: (e: MouseEvent) => void;
} => {
	const hasClicked = useRef<boolean>(false);

	const onMouseDown = useCallback(
		(e) => {
			if (isAtBackdropChildren(e, ref)) {
				hasClicked.current = false;
				return;
			}

			hasClicked.current = true;
		},
		[ref],
	);

	const onMouseUp = useCallback(
		(e: MouseEvent) => {
			if (isAtBackdropChildren(e, ref)) {
				hasClicked.current = false;
				return;
			}

			if (!hasClicked.current) {
				return;
			}

			hasClicked.current = false;
			e.stopPropagation();
			onDismiss?.();
		},
		[onDismiss, ref],
	);

	return {
		onMouseDown,
		onMouseUp,
	};
};

type ModalBackdropProps = {
	children?: ReactNode;
	onDismiss?: () => void;
};

const ModalBackdrop = ({ children, onDismiss }: ModalBackdropProps): ReactElement => {
	const ref = useRef<HTMLDivElement>(null);

	useEscapeKey(onDismiss);
	const { onMouseDown, onMouseUp } = useOutsideClick(ref, onDismiss);

	return (
		<Box
			ref={ref}
			children={children}
			className='rcx-modal__backdrop'
			position='fixed'
			zIndex={9999}
			inset={0}
			display='flex'
			flexDirection='column'
			backgroundColor='neutral-900-65'
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
		/>
	);
};

export default ModalBackdrop;
