import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type TextInputElementProps = BlockProps<UiKit.NumberInputElement | UiKit.EmailInputElement | UiKit.UrlInputElement>;

const inputType = {
	number_input: 'number',
	email_text_input: 'email',
	url_text_input: 'url',
} as const;

const TextInputElement = ({ block, context }: TextInputElementProps) => {
	const [{ loading, value, error }, action] = useUiKitState(block, context);
	const fromTextObjectToString = useStringFromTextObject();

	return (
		<InputBox
			type={inputType[block.type]}
			disabled={loading}
			id={block.actionId}
			name={block.actionId}
			error={error}
			value={value}
			onChange={action}
			placeholder={fromTextObjectToString(block.placeholder)}
			step={block.type === 'number_input' && !block.isDecimalAllowed ? 1 : undefined}
			min={block.type === 'number_input' ? block.minValue : undefined}
			max={block.type === 'number_input' ? block.maxValue : undefined}
		/>
	);
};

export default memo(TextInputElement);
