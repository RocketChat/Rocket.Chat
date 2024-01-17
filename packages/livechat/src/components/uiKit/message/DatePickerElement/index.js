import { memo, useCallback } from 'preact/compat';

import DateInput from '../../../Form/DateInput';
import { usePerformAction } from '../Block';

const DatePickerElement = ({ actionId, confirm /* , placeholder */, initialDate /* , parser */ }) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleChange = useCallback(
		async (event) => {
			event.preventDefault();

			if (confirm) {
				// TODO
			}

			await performAction({
				initialDate,
				selectedDate: event.target.value,
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
