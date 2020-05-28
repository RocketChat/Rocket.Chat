import { Box, Table, TextInput, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState, useEffect } from 'react';

import { GenericTable, Th } from '../../../app/ui/client/components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const FilterByTypeAndText = React.memo(({ setFilter, ...props }) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);

	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search_Integrations')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
});

const useQuery = (params, sort) => useMemo(() => ({
	query: JSON.stringify({ name: { $regex: params.text || '', $options: 'i' }, type: params.type }),
	sort: JSON.stringify({ [sort[0]]: sort[1] === 'asc' ? 1 : -1 }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [JSON.stringify(params), JSON.stringify(sort)]);

const useResizeInlineBreakpoint = (sizes = [], debounceDelay = 0) => {
	const { ref, borderBoxSize } = useResizeObserver({ debounceDelay });
	const inlineSize = borderBoxSize ? borderBoxSize.inlineSize : 0;
	sizes = useMemo(() => sizes.map((current) => (inlineSize ? inlineSize > current : true)), [inlineSize]);
	return [ref, ...sizes];
};

export function IntegrationsTable({ type }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const [ref, isBig] = useResizeInlineBreakpoint([700], 200);

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedText = useDebouncedValue(params.text, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery({ ...params, text: debouncedText, type }, debouncedSort);

	const { data } = useEndpointDataExperimental('integrations.list', query);

	const router = useRoute('admin-integrations');

	const onClick = (_id, type) => () => router.push({
		context: 'edit',
		type: type === 'webhook-incoming' ? 'incoming' : 'outgoing',
		id: _id,
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
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w={isBig ? 'x280' : 'x240'}>{t('Name')}</Th>,
		<Th key={'channel'} direction={sort[1]} active={sort[0] === 'channel'} onClick={onHeaderClick} sort='channel'>{t('Post_to')}</Th>,
		<Th key={'_createdBy'} direction={sort[1]} active={sort[0] === '_createdBy'} onClick={onHeaderClick} sort='_createdBy'>{t('Created_by')}</Th>,
		isBig && <Th key={'_createdAt'} direction={sort[1]} active={sort[0] === '_createdAt'} onClick={onHeaderClick} sort='_createdAt'>{t('Created_at')}</Th>,
		<Th key={'username'} direction={sort[1]} active={sort[0] === 'username'} onClick={onHeaderClick} sort='username'>{t('Post_as')}</Th>,
	].filter(Boolean), [sort, isBig]);

	const renderRow = useCallback(({ name, _id, type, username, _createdAt, _createdBy: { username: createdBy }, channel = [] }) => {
		const handler = useMemo(() => onClick(_id, type), []);
		return <Table.Row key={_id} onKeyDown={handler} onClick={handler} tabIndex={0} role='link' action>
			<Table.Cell style={style} color='default' fontScale='p2'>{name}</Table.Cell>
			<Table.Cell style={style}>{channel.join(', ')}</Table.Cell>
			<Table.Cell style={style}>{createdBy}</Table.Cell>
			{isBig && <Table.Cell style={style}>{formatDateAndTime(_createdAt)}</Table.Cell>}
			<Table.Cell style={style}>{username}</Table.Cell>
		</Table.Row>;
	}, []);

	return <GenericTable ref={ref} FilterComponent={FilterByTypeAndText} header={header} renderRow={renderRow} results={data && data.integrations} total={data && data.total} setParams={setParams} params={params} />;
}

export default IntegrationsTable;
