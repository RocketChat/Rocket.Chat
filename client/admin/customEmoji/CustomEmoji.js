import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Table, TextInput, Icon } from '@rocket.chat/fuselage';

import { GenericTable, Th } from '../../../app/ui/client/components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);
	return <Box mb='x16' is='form' display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

export function CustomEmoji({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}) {
	console.log(data);
	const t = useTranslation();

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		<Th key={'aliases'} direction={sort[1]} active={sort[0] === 'aliases'} onClick={onHeaderClick} sort='aliases'>{t('Aliases')}</Th>,
	].filter(Boolean), [sort]);

	const renderRow = (emojis) => {
		const { _id, name, aliases } = emojis;
		return <Table.Row key={_id} onKeyDown={onClick(_id, status)} onClick={onClick(_id, status)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default' style={style}>{name}</Table.Cell>
			<Table.Cell fontScale='p1' color='default' style={style}>{aliases}</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.update} total={data.total} setParams={setParams} params={params} />;
}
