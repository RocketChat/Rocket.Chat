import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, MutableRefObject, useEffect, useMemo, useState } from 'react';

import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';

const ModerationConsoleTable: FC<{ reload: MutableRefObject<() => void> }> = ({ reload }) => {
	const [text, setText] = useState('');

	const { sortBy, sortDirection, ...params } = useSort('ts');
	const { current, itemsPerPage, currentItemsPerPage, onChangeItemsPerPage } = usePagination();
	// write a custom query to get the reports data from the database
	const query = useDebouncedValue(
		useMemo(
			() => ({
				fields: JSON.stringify({
					_id: 1,
					message: 1,
					description: 1,
					ts: 1,
					userId: 1,
				}),
				query: JSON.stringify({
					$or: [
						{ 'message.msg': { $regex: text, $options: 'i' } },
						{ 'message.u.username': { $regex: text, $options: 'i' } },
						{ description: { $regex: text, $options: 'i' } },
					],
				}),
				sortBy: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
				count: itemsPerPage,
				offset: current,
			}),
			[current, itemsPerPage],
		),
		500,
	);

	const getReports = useEndpoint('GET', '/v1/moderation.getReports');

	const dispatchToastMessage = useToastMessageDispatch();

	const {
		data,
		reload: reloadReports,
		isLoading,
	} = useQuery(
		['reports', query],
		async () => {
			const reports = await getReports(query);
			return reports;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	useEffect(() => {
		reload.current = reloadReports;
	}, [reload, reloadReports]);

	console.log('data', data);

	return (
		<div>
			<h1>Moderation Console Table</h1>
		</div>
	);
};

export default ModerationConsoleTable;
