import type { LongPressEvents, PressEvents } from '../types/Attributes.contract';

export type FramePressHandlers = {
	onPress?: () => void;
	onPressIn?: () => void;
	onPressOut?: () => void;
	onLongPress?: () => void;
};

type FramePressProps = PressEvents &
	LongPressEvents & {
		/** The web alias of `onPress`; React Native has no click event to hand it. */
		onClick?: () => void;
		onPointerDown?: () => void;
		onPointerUp?: () => void;
	};

/** The press handlers a frame takes on React Native, where `render` is ignored: the web-style handlers mapped to its press events. */
export const pickFramePressHandlers = ({
	onPress,
	onClick,
	onPointerDown,
	onPointerUp,
	onLongPress,
}: FramePressProps): FramePressHandlers => {
	const handlers: FramePressHandlers = {};

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
