import { Box, Icon, Table, Tag, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useEffect, memo, useContext, useMemo } from 'react';

import AppAvatar from '../../components/basic/avatar/AppAvatar';
import GenericTable from '../../components/GenericTable';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import { useFilteredApps } from './hooks/useFilteredApps';
import AppMenu from './AppMenu';
import AppStatus from './AppStatus';
import { AppDataContext } from './AppProvider';

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

const AppRow = memo(function AppRow({
	medium,
	...props
}) {
	const {
		author: { name: authorName },
		name,
		id,
		description,
		categories,
		iconFileData,
		marketplaceVersion,
		iconFileContent,
		installed,
	} = props;
	const t = useTranslation();

	const [isFocused, setFocused] = useState(false);
	const [isHovered, setHovered] = useState(false);
	const isStatusVisible = isFocused || isHovered;

	const appsRoute = useRoute('admin-apps');

	const handleClick = () => {
		appsRoute.push({
			context: 'details',
			version: marketplaceVersion,
			id,
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
		key={id}
		role='link'
		action
		tabIndex={0}
		onClick={handleClick}
		onKeyDown={handleKeyDown}
		onFocus={() => setFocused(true)}
		onBlur={() => setFocused(false)}
		onMouseEnter={() => setHovered(true)}
		onMouseLeave={() => setHovered(false)}
	>
		<Table.Cell withTruncatedText display='flex' flexDirection='row'>
			<AppAvatar size='x40' mie='x8' alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData}/>
			<Box display='flex' flexDirection='column' alignSelf='flex-start'>
				<Box color='default' fontScale='p2'>{name}</Box>
				<Box color='default' fontScale='p2'>{`${ t('By') } ${ authorName }`}</Box>
			</Box>
		</Table.Cell>
		{medium && <Table.Cell>
			<Box display='flex' flexDirection='column'>
				<Box color='default' withTruncatedText>{description}</Box>
				{categories && <Box color='hint' display='flex' flex-direction='row' withTruncatedText>
					{categories.map((current) => <Tag disabled key={current} mie='x4'>{current}</Tag>)}
				</Box>}
			</Box>
		</Table.Cell>}
		<Table.Cell withTruncatedText>
			<Box display='flex' flexDirection='row' alignItems='center' marginInline='neg-x8' onClick={preventClickPropagation}>
				<AppStatus app={props} showStatus={isStatusVisible} marginInline='x8'/>
				{installed && <AppMenu app={props} invisible={!isStatusVisible} marginInline='x8'/>}
			</Box>
		</Table.Cell>
	</Table.Row>;
});

function AppsTable() {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	const [params, setParams] = useState(() => ({ text: '', current: 0, itemsPerPage: 25 }));
	const [sort, setSort] = useState(() => ['name', 'asc']);

	const { text, current, itemsPerPage } = params;
	const { data, dataCache } = useContext(AppDataContext);
	const [filteredApps, filteredAppsCount] = useFilteredApps({
		text: useDebouncedValue(text, 500),
		current,
		itemsPerPage,
		sort: useDebouncedValue(sort, 200),
		data: useMemo(
			() => (data.length ? data.filter((current) => current.installed) : null),
			[dataCache],
		),
		dataCache,
	});

	const [sortBy, sortDirection] = sort;

	const handleHeaderCellClick = (id) => {
		setSort(
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
				active={sortBy === 'name'}
				sort='name'
				width={onMediumBreakpoint ? 'x240' : 'x180'}
				onClick={handleHeaderCellClick}
			>
				{t('Name')}
			</GenericTable.HeaderCell>
			{onMediumBreakpoint && <GenericTable.HeaderCell>
				{t('Details')}
			</GenericTable.HeaderCell>}
			<GenericTable.HeaderCell width='x160'>
				{t('Status')}
			</GenericTable.HeaderCell>
		</>}
		results={filteredApps}
		total={filteredAppsCount}
		params={params}
		setParams={setParams}
		FilterComponent={FilterByText}
	>
		{(props) => <AppRow key={props.id} medium={onMediumBreakpoint} {...props} />}
	</GenericTable>;
}

export default AppsTable;
