import { useDebouncedValue, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useEndpointData } from '../../../hooks/useEndpointData';
import FilterByTypeAndText from './FilterByTypeAndText';
import IntegrationRow from './IntegrationRow';

const useQuery = ({ text, type, itemsPerPage, current }, [column, direction]) =>
	useMemo(
		() => ({
			query: JSON.stringify({ name: { $regex: text || '', $options: 'i' }, type }),
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[column, current, direction, itemsPerPage, text, type],
	);

const useResizeInlineBreakpoint = (sizes = [], debounceDelay = 0) => {
	const { ref, borderBoxSize } = useResizeObserver({ debounceDelay });
	const inlineSize = borderBoxSize ? borderBoxSize.inlineSize : 0;
	sizes = useMemo(() => sizes.map((current) => (inlineSize ? inlineSize > current : true)), [inlineSize, sizes]);
	return [ref, ...sizes];
};

function IntegrationsTable({ type }) {
	const t = useTranslation();
	const [ref, isBig] = useResizeInlineBreakpoint([700], 200);

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedText = useDebouncedValue(params.text, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery({ ...params, text: debouncedText, type }, debouncedSort);

	const { value: data } = useEndpointData('integrations.list', query);

	const router = useRoute('admin-integrations');

	const onClick = useCallback(
		(_id, type) => () =>
			router.push({
				context: 'edit',
				type: type === 'webhook-incoming' ? 'incoming' : 'outgoing',
				id: _id,
			}),
		[router],
	);

	const onHeaderClick = useCallback(
		(id) => {
			const [sortBy, sortDirection] = sort;

			if (sortBy === id) {
				setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
				return;
			}
			setSort([id, 'asc']);
		},
		[sort],
	);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key={'name'}
					direction={sort[1]}
					active={sort[0] === 'name'}
					onClick={onHeaderClick}
					sort='name'
					w={isBig ? 'x280' : 'x240'}
				>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'channel'} direction={sort[1]} active={sort[0] === 'channel'} onClick={onHeaderClick} sort='channel'>
					{t('Post_to')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'_createdBy'}
					direction={sort[1]}
					active={sort[0] === '_createdBy'}
					onClick={onHeaderClick}
					sort='_createdBy'
				>
					{t('Created_by')}
				</GenericTable.HeaderCell>,
				isBig && (
					<GenericTable.HeaderCell
						key={'_createdAt'}
						direction={sort[1]}
						active={sort[0] === '_createdAt'}
						onClick={onHeaderClick}
						sort='_createdAt'
					>
						{t('Created_at')}
					</GenericTable.HeaderCell>
				),
				<GenericTable.HeaderCell
					key={'username'}
					direction={sort[1]}
					active={sort[0] === 'username'}
					onClick={onHeaderClick}
					sort='username'
				>
					{t('Post_as')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, isBig, t],
	);

	const renderRow = useCallback((props) => <IntegrationRow {...props} isBig={isBig} onClick={onClick} />, [isBig, onClick]);

	return (
		<GenericTable
			ref={ref}
			header={header}
			renderRow={renderRow}
			results={data && data.integrations}
			total={data && data.total}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }) => <FilterByTypeAndText setFilter={onChange} {...props} />}
		/>
	);
}

export default IntegrationsTable;
