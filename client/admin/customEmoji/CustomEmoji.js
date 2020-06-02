import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Table, TextInput, Icon } from '@rocket.chat/fuselage';

import { GenericTable, Th } from '../../../app/ui/client/components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);
	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput flexShrink={0} placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
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
	const t = useTranslation();

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
		<Th key={'aliases'} w='x200'>{t('Aliases')}</Th>,
	], [sort]);

	const renderRow = (emojis) => {
		const { _id, name, aliases } = emojis;
		return <Table.Row key={_id} onKeyDown={onClick(_id, emojis)} onClick={onClick(_id, emojis)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{name}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{aliases}</Box></Table.Cell>
		</Table.Row>;
	};

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.emojis} total={data.total} setParams={setParams} params={params} />;
}
