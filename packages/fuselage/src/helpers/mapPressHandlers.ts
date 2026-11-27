import type { LongPressEvents, PressEvents } from '../types/Attributes.contract';

export type NativePressHandlers = {
	onPress?: () => void;
	onPressIn?: () => void;
	onPressOut?: () => void;
	onLongPress?: () => void;
};

type WebStylePressProps = PressEvents &
	LongPressEvents & {
		/** The web alias of `onPress`; React Native has no click event to hand it. */
		onClick?: () => void;
		onPointerDown?: () => void;
		onPointerUp?: () => void;
	};

/** The React Native press handlers for web-style press props. */
export const mapPressHandlers = ({
	onPress,
	onClick,
	onPointerDown,
	onPointerUp,
	onLongPress,
}: WebStylePressProps): NativePressHandlers => {
	const handlers: NativePressHandlers = {};

	if (onPress || onClick) {
		handlers.onPress = () => {
			onClick?.();
			onPress?.();
		};
	}
	if (onPointerDown) {
		handlers.onPressIn = onPointerDown;
	}
	if (onPointerUp) {
		handlers.onPressOut = onPointerUp;
	}
	if (onLongPress) {
		handlers.onLongPress = onLongPress;
	}

	return handlers;
};
