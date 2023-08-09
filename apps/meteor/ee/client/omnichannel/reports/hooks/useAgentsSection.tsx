import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { COLORS } from '../components/constants';
import { MOCK_AGENTS_DATA } from '../mock';

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		color: COLORS.info,
	}));

export const useAgentsSection = () => {
	const [filters, onFilter] = useState({});

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery(['reports', 'agents'], () => {
		return Promise.resolve(formatChartData(MOCK_AGENTS_DATA.data));
	});

	return {
		data,
		filters,
		isLoading,
		isError,
		onFilter,
	};
};
