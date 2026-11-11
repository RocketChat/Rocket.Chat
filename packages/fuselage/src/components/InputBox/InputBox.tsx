import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';

import { Icon } from '../Icon';
import Input, { type InputProps, type InputType } from './Input';
import InputBoxAddon from './InputBoxAddon';
import InputBoxWrapper from './InputBoxWrapper';

export type InputBoxProps<TElement extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement> = Omit<
	InputProps<TElement>,
	'is' | 'type' | 'undecorated' | 'wrapped'
> & {
	/** Lands on the wrapper when there is an addon, and on the input otherwise. */
	className?: string;
	startAddon?: ReactNode;
	endAddon?: ReactNode;
	/** Reduces the end padding so a button in `endAddon` sits flush with the input's edge. */
	endAddonFlush?: boolean;
	error?: string;
	type: InputType | 'textarea';
};

// Firefox draws its own calendar icon on a date input, so ours would be a duplicate
const drawsDatePicker = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('-moz-orient', 'inline');

/**
 * A decorated input control with support for addons.
 *
 * Usually you'll perfer to use `-Input` (e.g. <LinkTo kind='Forms/TextInput' story='Default'>`TextInput`</LinkTo>)
 * components over this one because it works as a construction block for them.
 */
function InputBox<TElement extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>({
	ref,
	className,
	startAddon,
	endAddon,
	endAddonFlush,
	error,
	hidden,
	invisible,
	type = 'text',
	...props
}: InputBoxProps<TElement>) {
	const innerRef = useRef<TElement>(null);
	const mergedRef = useMergedRefs(ref, innerRef);
	let defaultAddon = endAddon;

	useLayoutEffect(() => {
		innerRef.current?.setCustomValidity(error || '');
	}, [error]);

	const handleAddonClick = () => (innerRef.current as HTMLInputElement).showPicker();

	if (type === 'date') {
		defaultAddon = drawsDatePicker ? undefined : <Icon name='calendar' size='x20' onClick={handleAddonClick} />;
	}
	if (type === 'time') {
		defaultAddon = <Icon name='clock' size='x20' onClick={handleAddonClick} />;
	}

	const control = type === 'textarea' ? { is: 'textarea' as const } : { type };

	if (!defaultAddon && !startAddon) {
		return (
			<Input<TElement> {...control} className={className} hidden={hidden} invisible={invisible} ref={mergedRef} htmlSize={1} {...props} />
		);
	}

	return (
		<InputBoxWrapper
			className={className}
			hidden={hidden}
			invisible={invisible}
			endAddonFlush={endAddonFlush}
			textarea={type === 'textarea'}
			small={props.small}
		>
			{startAddon && <InputBoxAddon>{startAddon}</InputBoxAddon>}
			<Input<TElement> {...control} ref={mergedRef} htmlSize={1} undecorated wrapped {...props} />
			{defaultAddon && <InputBoxAddon>{defaultAddon}</InputBoxAddon>}
		</InputBoxWrapper>
	);
}

export default InputBox;
