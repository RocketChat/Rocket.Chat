import type { SelectOption } from '@rocket.chat/fuselage';
import { InputBoxSkeleton, Select } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type InstanceFilterSelectProps = {
	id: string;
};

// TODO: Requires endpoint to fetch instances
export const InstanceFilterSelect = ({ id }: InstanceFilterSelectProps) => {
	const { t } = useTranslation();
	// @ts-expect-error mock
	const getOptions = useEndpoint('GET', '/v1/apps/instances') as () => Promise<{ value: string; label: string }[]>;

	const { control } = useFormContext();

	const { data, isPending } = useQuery({
		queryKey: ['app-logs-filter-instances'],
		queryFn: async () => getOptions(),
	});

	const options: SelectOption[] = useMemo(() => {
		const mappedData: [string, string][] = data?.map((option) => [option.value, option.label]) || [];
		return [['all', t('All')], ...mappedData];
	}, [data, t]);

	if (isPending) {
		return <InputBoxSkeleton aria-label={t('Time')} aria-busy />;
	}

	return (
		<Controller
			control={control}
			name='instance'
			render={({ field }) => <Select id={id} aria-label={t('Time')} options={options} {...field} />}
		/>
	);
};
