import {
	Pagination,
	States,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesTitle,
	type TableColumnWidth,
	Text,
} from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
	getCombineFn,
	usePaginatedQuery,
	usePagination,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';

export type CustomEmojiProps = {
	reload: MutableRefObject<() => void>;
	onClick: (emoji: string) => () => void;
};

const CustomEmoji = ({ onClick, reload }: CustomEmojiProps) => {
	const t = useTranslation();

	const [text, setText] = useState('');
	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				name: text,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			}),
			[text, sortBy, sortDirection],
		),
		500,
	);

	const columns: TableColumnWidth[] = ['x200', 'x200'];

	const queryKey = ['getEmojiList', query];
	const {
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination({ resetKey: queryKey });

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='aliases'>{t('Aliases')}</GenericTableHeaderCell>,
		],
		[setSort, sortDirection, sortBy, t],
	);

	const getEmojiList = useEndpoint('GET', '/v1/emoji-custom.all');
	const { data, refetch, isSuccess, isLoading, isError } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: getEmojiList,
		combineData: getCombineFn('emojis'),
		offset: current,
		count: itemsPerPage,
	});

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	return (
		<>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data && data.emojis.length > 0 && (
				<>
					<GenericTable columns={columns} aria-label={t('Emoji')}>
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
											<Text truncate>{emojis.name}</Text>
										</GenericTableCell>
										<GenericTableCell color='default'>
											<Text truncate>{Array.isArray(emojis.aliases) ? emojis.aliases.join(', ') : emojis.aliases}</Text>
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
