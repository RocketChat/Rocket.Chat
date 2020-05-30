import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Table, TextInput, Icon, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { GenericTable, Th } from '../../../app/ui/client/components/GenericTable';
import { useCustomSound } from '../../contexts/CustomSoundContext';

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

export function AdminSounds({
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
