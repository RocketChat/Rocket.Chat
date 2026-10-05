import { EmailInput, NumberInput, UrlInput } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type FormattedTextInputElementProps = BlockProps<UiKit.NumberInputElement | UiKit.EmailTextInputElement | UiKit.UrlTextInputElement>;

const FormattedTextInputElement = ({ block, context }: FormattedTextInputElementProps) => {
	const [{ loading, value, error }, action] = useUiKitState(block, context);
	const fromTextObjectToString = useStringFromTextObject();

	if (block.type === 'number_input') {
		return (
			<NumberInput
				disabled={loading}
				id={block.actionId}
				autoFocus={block.focusOnLoad}
				name={block.actionId}
				error={error}
				value={value}
				onChange={action}
				placeholder={fromTextObjectToString(block.placeholder)}
				step={block.isDecimalAllowed ? 'any' : 1}
				min={block.minValue}
				max={block.maxValue}
			/>
		);
	}

	const Input = block.type === 'email_text_input' ? EmailInput : UrlInput;

	return (
		<Input
			disabled={loading}
			id={block.actionId}
			autoFocus={block.focusOnLoad}
			name={block.actionId}
			error={error}
			value={value}
			onChange={action}
			placeholder={fromTextObjectToString(block.placeholder)}
		/>
	);
};

export default memo(FormattedTextInputElement);
