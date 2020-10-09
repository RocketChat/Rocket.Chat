import React, { useMemo, useCallback } from 'react';
import { Box, Table, Icon, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { GenericTable, Th } from '../../components/GenericTable';
import { useCustomSound } from '../../contexts/CustomSoundContext';
import FilterByText from './FilterByText';

function AdminSounds({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		<Th w='x40' key='action'></Th>,
	], [sort]);

	const customSound = useCustomSound();

	const handlePlay = useCallback((sound) => {
		customSound.play(sound);
	}, []);

	const renderRow = (sound) => {
		const { _id, name } = sound;

		return <Table.Row key={_id} onKeyDown={onClick(_id, sound)} onClick={onClick(_id, sound)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{name}</Box></Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button ghost small square aria-label={t('Play')} onClick={(e) => e.preventDefault() & e.stopPropagation() & handlePlay(_id)}>
					<Icon name='play' size='x20' />
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.sounds} total={data.total} setParams={setParams} params={params} />;
}

export default AdminSounds;
