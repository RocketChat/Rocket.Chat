import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { COLORS } from '../components/constants';
import { MOCK_CHANNELS_DATA } from '../mock';

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		id: item.label,
		color: COLORS.info,
	}));

export const useChannelsSection = () => {
	const [filters, onFilter] = useState({});

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery(['reports', 'channels'], () => {
		return Promise.resolve(formatChartData(MOCK_CHANNELS_DATA.data));
	});

	return {
		data,
		filters,
		isLoading,
		isError,
		onFilter,
	};
};
