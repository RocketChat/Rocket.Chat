import { Box, Skeleton, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import Page from '../../../../components/Page';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';

const VoipExtensionsPage: FC = () => {
	const t = useTranslation();

	// const handleClick = useMutableCallback(() =>
	// 	// tagsRoute.push({
	// 	// 	context: 'new',
	// 	// }),
	// );

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [text] = useState('');

	const { sortBy, sortDirection, setSort } = useSort<'extension'>('extension');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				query: JSON.stringify({ name: { $regex: text || '', $options: 'i' } }),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const { value: data, phase, reload } = useEndpointData('omnichannel/extensions', query);
	console.log('data', data);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key='extension'
					direction={sortDirection}
					active={sortBy === 'extension'}
					onClick={setSort}
					sort='extension'
					w='x200'
				>
					{t('Extension_Number' as 'color')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key='username' direction={sortDirection} onClick={setSort} sort='username' w='x200'>
					{t('Agent_Name' as 'color')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[t],
	);

	const renderRow = useCallback(
		({ _id, extension, username, state }) => (
			<Table.Row key={_id} tabIndex={0} role='link' action>
				<Table.Cell withTruncatedText>{extension}</Table.Cell>
				<Table.Cell withTruncatedText>{username || state}</Table.Cell>
				<Table.Cell withTruncatedText>remove</Table.Cell>
				{/* <RemoveTagButton _id={_id} reload={reload} /> */}
			</Table.Row>
		),
		[reload],
	);

	if (phase === AsyncStatePhase.LOADING) {
		return <Skeleton width='full' />;
	}

	if (!data) {
		return null;
	}

	console.log(data);

	return (
		<Page.Content>
			{/* <Box marginBlock='none' marginInline='auto' width='full' display='flex' flexDirection='column' overflowY='hidden' height='full'> */}
			<GenericTable
				header={header}
				renderRow={renderRow}
				results={data.extensions}
				total={data.total}
				// renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
			/>
			{/* </Box> */}
		</Page.Content>
	);
};

export default VoipExtensionsPage;
