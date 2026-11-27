import { createElement, type ElementType } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';

import { pickFramePressHandlers } from './pickFramePressHandlers.native';

const textTags = new Set([
	'span',
	'p',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'label',
	'legend',
	'strong',
	'em',
	'small',
	'b',
	'i',
	'u',
	's',
	'a',
	'code',
	'pre',
	'time',
	'dt',
	'dd',
	'figcaption',
	'mark',
	'sub',
	'sup',
	'q',
	'cite',
	'abbr',
	'kbd',
	'samp',
	'var',
	'del',
	'ins',
]);

const inputTags = new Set(['input', 'textarea']);

type PressProps = {
	onClick?: () => void;
	onPress?: () => void;
	onPressIn?: () => void;
	onPressOut?: () => void;
	onLongPress?: () => void;
	onPointerDown?: () => void;
	onPointerUp?: () => void;
};

const hasPressHandler = ({ onClick, onPress, onPressIn, onPressOut, onLongPress }: PressProps) =>
	Boolean(onClick || onPress || onPressIn || onPressOut || onLongPress);

const withNativePress = ({ onClick, onPointerDown, onPointerUp, onPress, onPressIn, onPressOut, onLongPress, ...props }: PressProps) => ({
	...props,
	...pickFramePressHandlers({ onClick, onPointerDown, onPointerUp, onPress, onLongPress }),
	...(onPressIn && { onPressIn }),
	...(onPressOut && { onPressOut }),
});

/** A `View` that becomes a `Pressable` when it carries a press handler. */
const PressableView = (props: PressProps) =>
	hasPressHandler(props) ? createElement(Pressable, withNativePress(props)) : createElement(View, props);

/** A `Text` that takes its own press events when it carries a press handler. */
const PressableText = (props: PressProps) => createElement(Text, hasPressHandler(props) ? withNativePress(props) : props);

/** The React Native host component a tag name stands for; anything that is not a tag name is returned as it is. */
export const resolveHost = (is: ElementType): ElementType => {
	if (typeof is !== 'string') {
		return is;
	}
	if (textTags.has(is)) {
		return PressableText;
	}
	if (inputTags.has(is)) {
		return TextInput;
	}
	if (is === 'img') {
		return Image;
	}
	return PressableView;
};

/** The React Native host component for text, whatever tag name the text asks for. */
export const resolveTextHost = (is: ElementType): ElementType => (typeof is === 'string' ? Text : is);
