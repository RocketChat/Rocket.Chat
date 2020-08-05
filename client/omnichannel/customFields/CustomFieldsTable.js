import { Box, Icon, Table, Button, TextInput, Callout } from '@rocket.chat/fuselage';
import React, { useCallback, useState, useEffect, memo, useMemo } from 'react';

import GenericTable from '../../components/GenericTable';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';

const FilterByText = memo(({ setFilter, ...props }) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search_Apps')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
});

const CustomFieldsRow = memo(function CustomFieldsRow({
	medium,
	onDelete = () => {},
	...props
}) {
	const {
		_id,
		label,
		scope,
		visibility,
	} = props;

	const t = useTranslation();

	const cfRoute = useRoute('omnichannel-customfields');

	const handleClick = () => {
		cfRoute.push({
			context: 'edit',
			id: _id,
		});
	};

	const handleKeyDown = (e) => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	};

	const preventClickPropagation = (e) => {
		e.stopPropagation();
	};

	return <Table.Row
		key={_id}
		role='link'
		action
		tabIndex={0}
		onClick={handleClick}
		onKeyDown={handleKeyDown}
	>
		<Table.Cell withTruncatedText>
			{_id}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{label}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{scope}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{visibility}
		</Table.Cell>
		<Table.Cell withTruncatedText onClick={preventClickPropagation}>
			<Button small primary danger onClick={onDelete} title={t('Delete')}>
				<Icon name='trash' size='x16'/>
			</Button>
		</Table.Cell>
	</Table.Row>;
});

const useQuery = ({ text, types, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	filter: text || '',
	types,
	sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, types, itemsPerPage, current, column, direction]);

const CustomFieldsTableContainer = () => {
	const t = useTranslation();
	const [params, setParams] = useState(() => ({ text: '', current: 0, itemsPerPage: 25 }));
	const [sort, setSort] = useState(() => ['name', 'asc']);

	const query = useQuery(params, sort);

	const { data, state } = useEndpointDataExperimental('livechat/custom-fields', query);

	if (state === ENDPOINT_STATES.ERROR) {
		return <Callout>
			{t('Error')}: error
		</Callout>;
	}

	return <CustomFieldsTable
		customFields={data?.customFields}
		totalCustomFields={data?.total}
		params={params}
		onSort={setSort}
		onChangeParams={setParams}
		sort={sort}
	/>;
};

export function CustomFieldsTable({ customFields, totalCustomFields, params, sort, onSort, onChangeParams }) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	const [sortBy, sortDirection] = sort;

	const handleHeaderCellClick = (id) => {
		onSort(
			([sortBy, sortDirection]) =>
				(sortBy === id
					? [id, sortDirection === 'asc' ? 'desc' : 'asc']
					: [id, 'asc']),
		);
	};

	return <GenericTable
		ref={ref}
		header={<>
			<GenericTable.HeaderCell
				direction={sortDirection}
				active={sortBy === 'field'}
				sort='field'
				onClick={onSort}
				onClick={handleHeaderCellClick}
			>
				{t('Field')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Label')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell >
				{t('Scope')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell >
				{t('Visibility')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell width='x60' />
		</>}
		results={customFields}
		total={totalCustomFields}
		params={params}
		setParams={onChangeParams}
		FilterComponent={FilterByText}
	>
		{(props) => <CustomFieldsRow key={props._id} medium={onMediumBreakpoint} {...props} />}
	</GenericTable>;
}

export default CustomFieldsTableContainer;
