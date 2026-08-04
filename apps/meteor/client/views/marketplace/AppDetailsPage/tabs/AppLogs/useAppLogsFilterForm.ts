import { useForm, useFormContext } from 'react-hook-form';

export type AppLogsFilterFormData = {
	startDate?: string;
	endDate?: string;
	startTime?: string;
	endTime?: string;
	instance?: string;
	severity?: 'all' | '0' | '1' | '2';
	event?: string;
	timeFilter?: string;
};

export const useAppLogsFilterForm = () =>
	useForm<AppLogsFilterFormData>({
		defaultValues: {
			severity: 'all',
			instance: 'all',
			timeFilter: 'all',
			event: 'all',
			startDate: '',
			endDate: '',
			startTime: '',
			endTime: '',
		},
	});

export const useAppLogsFilterFormContext = () => useFormContext<AppLogsFilterFormData>();
