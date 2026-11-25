import { InputBox } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type TimePickerElementProps = BlockProps<UiKit.TimePickerElement>;

const getTimezoneLabel = (timezone: string | undefined) => {
	if (!timezone) {
		return undefined;
	}

	try {
		return new Intl.DateTimeFormat(undefined, { timeZone: timezone, timeZoneName: 'short' })
			.formatToParts(new Date())
			.find(({ type }) => type === 'timeZoneName')?.value;
	} catch {
		return undefined;
	}
};

const TimePickerElement = ({ block, context }: TimePickerElementProps) => {
	const [{ loading, value, error }, action] = useUiKitState(block, context);
	const { actionId, placeholder } = block;
	const fromTextObjectToString = useStringFromTextObject();

	return (
		<InputBox
			type='time'
			error={error}
			value={value}
			disabled={loading}
			id={actionId}
			autoFocus={block.focus_on_load}
			name={actionId}
			rows={6}
			placeholder={fromTextObjectToString(placeholder)}
			startAddon={getTimezoneLabel(block.timezone)}
			onInput={action}
		/>
	);
};

export default TimePickerElement;
