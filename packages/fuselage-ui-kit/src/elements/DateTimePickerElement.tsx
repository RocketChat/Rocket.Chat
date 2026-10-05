import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { FormEvent } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type DateTimePickerElementProps = BlockProps<UiKit.DateTimePickerElement>;

const pad = (value: number) => String(value).padStart(2, '0');

const toLocalInputValue = (seconds: number | undefined) => {
	if (seconds === undefined) {
		return '';
	}

	const date = new Date(seconds * 1000);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const DateTimePickerElement = ({ block, context }: DateTimePickerElementProps) => {
	const [{ loading, value, error }, action] = useUiKitState(block, context);

	const handleInput = (event: FormEvent<HTMLElement>) => {
		const { value } = event.currentTarget as HTMLInputElement;
		// A datetime-local value has no offset, so Date reads it in the user's time zone.
		void action({ target: { value: value ? Math.floor(new Date(value).getTime() / 1000) : undefined } });
	};

	return (
		<InputBox
			type='datetime-local'
			error={error}
			value={toLocalInputValue(value)}
			disabled={loading}
			id={block.actionId}
			autoFocus={block.focusOnLoad}
			name={block.actionId}
			onInput={handleInput}
		/>
	);
};

export default DateTimePickerElement;
