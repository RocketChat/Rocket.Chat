import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback, useRef } from 'react';

type UseLongPressResult = {
	onClick: () => void;
	onMouseDown: () => void;
	onMouseUp: () => void;
	onTouchStart: () => void;
	onTouchEnd: () => void;
};

export function useLongPress(onLongPress: () => void, options?: { onClick?: () => void; threshold?: number }): UseLongPressResult {
	const action = useRef<'LONG_PRESS' | 'CLICK'>();
	const isLongPress = useRef(false);
	const timerRef = useRef<NodeJS.Timeout>();

	const startPressTimer = useMutableCallback((): void => {
		isLongPress.current = false;
		timerRef.current = setTimeout(() => {
			isLongPress.current = true;
			action.current = 'LONG_PRESS';
			onLongPress();
		}, options?.threshold ?? 700);
	});

	const handleOnClick = useMutableCallback((): void => {
		if (isLongPress.current || !options?.onClick) {
			return;
		}

		action.current = 'CLICK';

		options.onClick();
	});

	const handleOnMouseDown = useCallback((): void => {
		startPressTimer();
	}, [startPressTimer]);

	const handleOnMouseUp = useCallback((): void => {
		clearTimeout(timerRef.current);
	}, []);

	const handleOnTouchStart = useCallback((): void => {
		startPressTimer();
	}, [startPressTimer]);

	const handleOnTouchEnd = useCallback((): void => {
		if (action.current === 'LONG_PRESS') {
			return;
		}

		clearTimeout(timerRef.current);
	}, []);

	return {
		onClick: handleOnClick,
		onMouseDown: handleOnMouseDown,
		onMouseUp: handleOnMouseUp,
		onTouchStart: handleOnTouchStart,
		onTouchEnd: handleOnTouchEnd,
	};
}
