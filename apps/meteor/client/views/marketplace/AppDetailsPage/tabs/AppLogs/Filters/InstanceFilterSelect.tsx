import type { SelectOption } from '@rocket.chat/fuselage';
import { InputBoxSkeleton, Select } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type InstanceFilterSelectProps = Omit<ComponentProps<typeof Select>, 'options'>;

export const InstanceFilterSelect = ({ ...props }: InstanceFilterSelectProps) => {
	const { t } = useTranslation();
	// @ts-expect-error The endpoint is to be merged in https://github.com/RocketChat/Rocket.Chat/pull/36245
	const getOptions = useEndpoint('GET', '/apps/logs/instanceIds');

	const { data, isPending } = useQuery({
		queryKey: ['app-logs-filter-instances'],
		// @ts-expect-error The endpoint is to be merged in https://github.com/RocketChat/Rocket.Chat/pull/36245
		queryFn: async () => getOptions(),
	});

	const options: SelectOption[] = useMemo(() => {
		// @ts-expect-error The endpoint is to be merged in https://github.com/RocketChat/Rocket.Chat/pull/36245
		const mappedData: [string, string][] = data?.instanceIds?.map((id: string) => [id, id]) || [];
		return [['all', t('All')], ...mappedData];
	}, [data, t]);

	if (isPending) {
		return <InputBoxSkeleton aria-labelledby={props['aria-labelledby']} aria-busy />;
	}

	return <Select options={options} {...props} />;
};
