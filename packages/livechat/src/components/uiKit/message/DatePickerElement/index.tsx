import type * as uikit from '@rocket.chat/ui-kit';
import type { ChangeEvent } from 'preact/compat';
import { memo, useCallback } from 'preact/compat';

import DateInput from '../../../Form/DateInput';
import { usePerformAction } from '../Block';

type DatePickerElementProps = uikit.DatePickerElement;

const DatePickerElement = ({ actionId, confirm /* , placeholder */, initialDate /* , parser */ }: DatePickerElementProps) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleChange = useCallback(
		async (event: ChangeEvent<HTMLInputElement>) => {
			event.preventDefault();

			if (confirm) {
				// TODO
			}

			await performAction({
				initialDate,
				selectedDate: event.currentTarget?.value,
			});
		},
		[confirm, initialDate, performAction],
	);

	return (
		<DateInput
			value={initialDate}
			disabled={performingAction}
			// TODO: placeholder={parser.text(placeholder)}
			small
			onChange={handleChange}
		/>
	);
};

export default memo(DatePickerElement);
