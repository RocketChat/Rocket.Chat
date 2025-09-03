import type { SelectOption } from '@rocket.chat/fuselage';
import { InputBoxSkeleton, Select } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useLogsDistinctValues } from '../../../../hooks/useLogsDistinctValues';

type InstanceFilterSelectProps = Omit<ComponentProps<typeof Select>, 'options'> & { appId: string };

export const InstanceFilterSelect = ({ appId, ...props }: InstanceFilterSelectProps) => {
	const { t } = useTranslation();

	const { data, isPending } = useLogsDistinctValues(appId);

	const options: SelectOption[] = useMemo(() => {
		const mappedData: [string, string][] = data?.instanceIds?.map((id: string) => [id, id]) || [];
		return [['all', t('All')], ...mappedData];
	}, [data, t]);

	if (isPending) {
		return <InputBoxSkeleton aria-labelledby={props['aria-labelledby']} aria-busy />;
	}

	return <Select options={options} {...props} />;
};
