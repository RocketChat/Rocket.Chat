import { TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import { TextAreaInput as FieldTextAreaInput, TextInput as FieldTextInput } from '@rocket.chat/fuselage-forms';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type PlainTextInputElementProps = BlockProps<UiKit.PlainTextInputElement>;

const PlainTextInputElement = ({ block, context }: PlainTextInputElementProps) => {
	const [{ loading, value, error }, action] = useUiKitState(block, context);
	const fromTextObjectToString = useStringFromTextObject();
	const inField = context === UiKit.BlockContext.FORM;

	if (block.multiline) {
		const Input = inField ? FieldTextAreaInput : TextAreaInput;

		return (
			<Input
				disabled={loading}
				id={block.actionId}
				name={block.actionId}
				rows={6}
				error={error}
				value={value}
				onChange={action}
				placeholder={fromTextObjectToString(block.placeholder)}
			/>
		);
	}

	const Input = inField ? FieldTextInput : TextInput;

	return (
		<Input
			disabled={loading}
			id={block.actionId}
			name={block.actionId}
			error={error}
			value={value}
			onChange={action}
			placeholder={fromTextObjectToString(block.placeholder)}
		/>
	);
};

export default memo(PlainTextInputElement);
