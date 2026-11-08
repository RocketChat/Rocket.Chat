import type { Actionable } from '../Actionable';

/** Picks a date and a time together; the value is a Unix timestamp in seconds, shown in the user's time zone. */
export type DateTimePickerElement = Actionable<{
	type: 'datetimepicker';
	initial_date_time?: number;
	focus_on_load?: boolean;
}>;
