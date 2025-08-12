import { Box, Pagination, States, StatesActions, StatesAction, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';

type CustomEmojiProps = {
	reload: MutableRefObject<() => void>;
	onClick: (emoji: string) => () => void;
};

const CustomEmoji = ({ onClick, reload }: CustomEmojiProps) => {
	const t = useTranslation();

	const [text, setText] = useState('');
	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useDebouncedValue(
		useMemo(
			() => ({
				query: JSON.stringify({ name: { $regex: escapeRegExp(text), $options: 'i' } }),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name' w='x200'>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='aliases' w='x200'>
				{t('Aliases')}
			</GenericTableHeaderCell>,
		],
		[setSort, sortDirection, sortBy, t],
	);

	const getEmojiList = useEndpoint('GET', '/v1/emoji-custom.all');
	const { data, refetch, isSuccess, isLoading, isError } = useQuery({
		queryKey: ['getEmojiList', query],
		queryFn: () => getEmojiList(query),
	});

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	return (
		<>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data && data.emojis.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{isSuccess &&
								data?.emojis.map((emojis) => (
									<GenericTableRow
										key={emojis._id}
										onKeyDown={onClick(emojis._id)}
										onClick={onClick(emojis._id)}
										tabIndex={0}
										role='link'
										action
										qa-emoji-id={emojis._id}
									>
										<GenericTableCell color='default'>
											<Box withTruncatedText>{emojis.name}</Box>
										</GenericTableCell>
										<GenericTableCell color='default'>
											<Box withTruncatedText>{Array.isArray(emojis.aliases) ? emojis.aliases.join(', ') : emojis.aliases}</Box>
										</GenericTableCell>
									</GenericTableRow>
								))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isSuccess && data && data.emojis.length === 0 && <GenericNoResults />}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default CustomEmoji;
