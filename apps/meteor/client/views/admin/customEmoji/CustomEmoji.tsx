import { Box, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, MutableRefObject } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
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
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';

type CustomEmojiProps = {
	reload: MutableRefObject<() => void>;
	onClick: (emoji: string) => () => void;
};

const CustomEmoji: FC<CustomEmojiProps> = function CustomEmoji({ onClick, reload }) {
	const t = useTranslation();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [text, setText] = useState('');

	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');

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

	const { value: data, phase, reload: reloadEndPoint } = useEndpointData('/v1/emoji-custom.all', query);

	useEffect(() => {
		reload.current = reloadEndPoint;
	}, [reload, reloadEndPoint]);
	return (
		<>
			<FilterByText onChange={({ text }): void => setText(text)} />
			<GenericTable>
				<GenericTableHeader>
					<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name' w='x200'>
						{t('Name')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='aliases' w='x200'>
						{t('Aliases')}
					</GenericTableHeaderCell>
				</GenericTableHeader>
				<GenericTableBody>
					{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={2} />}
					{phase === AsyncStatePhase.RESOLVED &&
						data &&
						data.emojis &&
						data.emojis.length > 0 &&
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
								<GenericTableCell fontScale='p1' color='default'>
									<Box withTruncatedText>{emojis.name}</Box>
								</GenericTableCell>
								<GenericTableCell fontScale='p1' color='default'>
									<Box withTruncatedText>{emojis.aliases}</Box>
								</GenericTableCell>
							</GenericTableRow>
						))}
					{/* {phase === AsyncStatePhase.RESOLVED &&
						!data.emojis.length
						))} */}
				</GenericTableBody>
			</GenericTable>
			{phase === AsyncStatePhase.RESOLVED && (
				<Pagination
					current={current}
					itemsPerPage={itemsPerPage}
					count={data?.total || 0}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={onSetCurrent}
					{...paginationProps}
				/>
			)}
		</>
	);
};

export default CustomEmoji;
