import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Table, TextInput, Icon, Tag } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import AppAvatar from '../../components/basic/avatar/AppAvatar';
import AppStatus from './AppStatus';
import { GenericTable, Th } from '../../components/GenericTable';
import { useLoggedInCloud } from './hooks/useLoggedInCloud';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useFilteredLocalApps } from './hooks/useFilteredLocalApps';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import AppMenu from './AppMenu';

const FilterByText = React.memo(({ setFilter, ...props }) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);

	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search_Apps')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
});

export function AppsTable({ setModal }) {
	const t = useTranslation();
	const [ref, isMedium] = useResizeInlineBreakpoint([600], 200);

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedText = useDebouncedValue(params.text, 500);
	const debouncedSort = useDebouncedValue(sort, 200);

	const [data, total] = useFilteredLocalApps({ sort: debouncedSort, text: debouncedText, ...params });

	const isLoggedIn = useLoggedInCloud();

	const router = useRoute('admin-apps');

	const onClick = (id, version) => () => router.push({
		context: 'details',
		version,
		id,
	});

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w={isMedium ? 'x240' : 'x180'}>{t('Name')}</Th>,
		isMedium && <Th key={'details'}>{t('Details')}</Th>,
		<Th key={'status'} w='x160'>{t('Status')}</Th>,
	].filter(Boolean), [sort, isMedium]);

	const renderRow = useCallback((props) => {
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

		const [showStatus, setShowStatus] = useState(false);

		const toggleShow = (state) => () => setShowStatus(state);
		const handler = onClick(id, marketplaceVersion);
		const preventDefault = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);

		return <Table.Row key={id} data-id={id} data-version={marketplaceVersion} onKeyDown={handler} onClick={handler} tabIndex={0} role='link' action onMouseEnter={toggleShow(true)} onMouseLeave={toggleShow(false)} >
			{useMemo(() => <Table.Cell withTruncatedText display='flex' flexDirection='row'>
				<AppAvatar size='x40' mie='x8' alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData}/>
				<Box display='flex' flexDirection='column' alignSelf='flex-start'>
					<Box color='default' fontScale='p2'>{name}</Box>
					<Box color='default' fontScale='p2'>{`${ t('By') } ${ authorName }`}</Box>
				</Box>
			</Table.Cell>, [iconFileContent, iconFileData, name, authorName])}
			{useMemo(() => isMedium && <Table.Cell>
				<Box display='flex' flexDirection='column'>
					<Box color='default' withTruncatedText>{description}</Box>
					{categories && <Box color='hint' display='flex' flex-direction='row' withTruncatedText>
						{categories.map((current) => <Tag disabled key={current} mie='x4'>{current}</Tag>)}
					</Box>}
				</Box>
			</Table.Cell>, [JSON.stringify(categories), description])}
			{useMemo(() => <Table.Cell withTruncatedText>
				<Box display='flex' flexDirection='row' alignItems='center' onClick={preventDefault}>
					<AppStatus app={props} setModal={setModal} isLoggedIn={isLoggedIn} showStatus={showStatus} mie='x4'/>
					{installed && <AppMenu display={showStatus ? 'block' : 'none'} app={props} setModal={setModal} isLoggedIn={isLoggedIn} mis='x4'/>}
				</Box>
			</Table.Cell>, [showStatus, JSON.stringify(props), isLoggedIn, showStatus])}
		</Table.Row>;
	}, [isMedium]);

	return <GenericTable
		ref={ref}
		FilterComponent={FilterByText}
		header={header}
		renderRow={renderRow}
		results={data}
		total={total}
		setParams={setParams}
		params={params}
	/>;
}

export default AppsTable;
