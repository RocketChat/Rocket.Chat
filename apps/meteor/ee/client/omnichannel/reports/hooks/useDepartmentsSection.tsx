import { Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { MOCK_DEPARTMENTS_DATA } from '../mock';

const colors = {
	warning: Palette.statusColor['status-font-on-warning'].toString(),
	danger: Palette.statusColor['status-font-on-danger'].toString(),
	success: Palette.statusColor['status-font-on-success'].toString(),
	info: Palette.statusColor['status-font-on-info'].toString(),
};

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		color: colors.info,
	}));

export const useDepartmentsSection = () => {
	const t = useTranslation();
	const [filters, onFilter] = useState({});

	const {
		data: { data: rawData } = {},
		isLoading,
		isError,
	} = useQuery(['reports', 'departments'], () => {
		return Promise.resolve(MOCK_DEPARTMENTS_DATA);
	});

	const data = useMemo(() => formatChartData(rawData), [rawData]);

	return {
		data,
		filters,
		isLoading,
		isError,
		onFilter,
	};
};
