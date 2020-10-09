import React, { useMemo } from 'react';
import { Box, Table } from '@rocket.chat/fuselage';

import { GenericTable, Th } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import FilterByText from './FilterByText';

function CustomEmoji({
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
	], [onHeaderClick, sort, t]);

	const renderRow = (emojis) => {
		const { _id, name, aliases } = emojis;
		return <Table.Row key={_id} onKeyDown={onClick(_id, emojis)} onClick={onClick(_id, emojis)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{name}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{aliases}</Box></Table.Cell>
		</Table.Row>;
	};

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.emojis} total={data.total} setParams={setParams} params={params} />;
}

export default CustomEmoji;
