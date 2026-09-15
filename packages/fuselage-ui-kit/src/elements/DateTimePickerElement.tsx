import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type DateTimePickerElementProps = BlockProps<UiKit.DateTimePickerElement>;

const DateTimePickerElement = ({ block, context }: DateTimePickerElementProps) => {
	const [{ loading, value, error }, action] = useUiKitState(block, context);
	const { actionId, placeholder } = block;
	const fromTextObjectToString = useStringFromTextObject();

	return (
		<InputBox
			type='datetime-local'
			error={error}
			value={value as string}
			disabled={loading}
			id={actionId}
			name={actionId}
			placeholder={fromTextObjectToString(placeholder)}
			onInput={action}
		/>
	);
};

export default DateTimePickerElement;
