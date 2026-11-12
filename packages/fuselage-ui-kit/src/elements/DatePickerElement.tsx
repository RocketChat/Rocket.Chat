import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject.js';
import { useUiKitState } from '../hooks/useUiKitState.js';
import type { BlockProps } from '../utils/BlockProps.js';

export type DatePickerElementProps = BlockProps<UiKit.DatePickerElement>;

const DatePickerElement = ({ block, context }: DatePickerElementProps) => {
	const [{ loading, value, error }, action] = useUiKitState(block, context);
	const { actionId, placeholder } = block;
	const fromTextObjectToString = useStringFromTextObject();

	return (
		<InputBox
			type='date'
			error={error}
			value={value}
			disabled={loading}
			id={actionId}
			autoFocus={block.focus_on_load}
			name={actionId}
			rows={6}
			placeholder={fromTextObjectToString(placeholder)}
			onInput={action}
		/>
	);
};

export default DatePickerElement;
