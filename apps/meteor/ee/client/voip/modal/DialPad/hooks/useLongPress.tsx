import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MouseEvent, MouseEventHandler, TouchEvent, TouchEventHandler, useRef } from 'react';

type UseLongPressResult = {
	onClick: MouseEventHandler<HTMLButtonElement>;
	onMouseDown: MouseEventHandler<HTMLButtonElement>;
	onMouseUp: MouseEventHandler<HTMLButtonElement>;
	onTouchStart: TouchEventHandler<HTMLButtonElement>;
	onTouchEnd: TouchEventHandler<HTMLButtonElement>;
};

export function useLongPress(
	onLongPress: () => void,
	options?: Partial<UseLongPressResult> & {
		threshold?: number;
	},
): UseLongPressResult {
	const isLongPress = useRef(false);
	const timerRef = useRef<NodeJS.Timeout>();

	const startPressTimer = useMutableCallback((): void => {
		isLongPress.current = false;
		timerRef.current = setTimeout(() => {
			isLongPress.current = true;
			onLongPress();
		}, options?.threshold ?? 700);
	});

	const handleOnClick = useMutableCallback((e: MouseEvent<HTMLButtonElement>): void => {
		if (isLongPress.current || !options?.onClick) {
			return;
		}

		options.onClick(e);
	});

	const handleOnMouseDown = useMutableCallback((e: MouseEvent<HTMLButtonElement>): void => {
		startPressTimer();

		options?.onMouseDown?.(e);
	});

	const handleOnMouseUp = useMutableCallback((e: MouseEvent<HTMLButtonElement>): void => {
		clearTimeout(timerRef.current);

		options?.onMouseUp?.(e);
	});

	const handleOnTouchStart = useMutableCallback((e: TouchEvent<HTMLButtonElement>): void => {
		startPressTimer();

		options?.onTouchStart?.(e);
	});

	const handleOnTouchEnd = useMutableCallback((e: TouchEvent<HTMLButtonElement>): void => {
		clearTimeout(timerRef.current);

		if (options?.onTouchEnd) {
			options.onTouchEnd(e);
		}
	});

	return {
		onClick: handleOnClick,
		onMouseDown: handleOnMouseDown,
		onMouseUp: handleOnMouseUp,
		onTouchStart: handleOnTouchStart,
		onTouchEnd: handleOnTouchEnd,
	};
}
