import { Box } from '@rocket.chat/fuselage';
import { useSafeRefCallback, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { useCallback, useEffect } from 'react';

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

const isAtBackdropChildren = (e: MouseEvent, backdrop: HTMLElement): boolean => {
	const { parentElement } = e.target as HTMLElement;

	return Boolean(parentElement) && backdrop.contains(parentElement);
};

// Dismissal requires both halves of the click to land on the backdrop itself, so that a drag started inside the modal and released over the backdrop keeps the modal open.
const useOutsideClick = (onDismiss: (() => void) | undefined) => {
	const handleDismiss = useStableCallback(() => onDismiss?.());

	return useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
				let hasClicked = false;

				const onMouseDown = (e: MouseEvent): void => {
					if (isAtBackdropChildren(e, node)) {
						hasClicked = false;
						return;
					}

					hasClicked = true;
				};

				const onMouseUp = (e: MouseEvent): void => {
					if (isAtBackdropChildren(e, node)) {
						hasClicked = false;
						return;
					}

					if (!hasClicked) {
						return;
					}

					hasClicked = false;
					e.stopPropagation();
					handleDismiss();
				};

				node.addEventListener('mousedown', onMouseDown);
				node.addEventListener('mouseup', onMouseUp);

				return () => {
					node.removeEventListener('mousedown', onMouseDown);
					node.removeEventListener('mouseup', onMouseUp);
				};
			},
			[handleDismiss],
		),
	);
};

export type ModalBackdropProps = {
	children?: ReactNode;
	onDismiss?: () => void;
};

const ModalBackdrop = ({ children, onDismiss }: ModalBackdropProps) => {
	useEscapeKey(onDismiss);
	const ref = useOutsideClick(onDismiss);

	return (
		<Box ref={ref} className='rcx-modal__backdrop' position='fixed' zIndex={9999} inset={0} display='flex' flexDirection='column'>
			{children}
		</Box>
	);
};

export default ModalBackdrop;
