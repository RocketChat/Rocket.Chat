import React from 'react';
import { Field, Button, InputBox, Box, Margins } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/VerticalBar';

export const DateTimeRow = ({
	label,
	start,
	handleStart,
}) => {
	return (
		<Field >
			<Field.Label flexGrow={0}>{label}</Field.Label>
			<Box display='flex' mi='neg-x4'>
				<Margins inline='x4'>
					<InputBox type='date' onChange={handleStart} value={start} flexGrow={1} h='x20'/>
					<InputBox type='time' onChange={handleStart} value={start} flexGrow={1} h='x20'/>
				</Margins>
			</Box>
		</Field>
	);
};

export const PruneMessages = ({
	onClickClose,
}) => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='eraser' />
				<VerticalBar.Text>{t('Prune_Messages')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<DateTimeRow label={t('Newer_than')} />
				<DateTimeRow label={t('Older_than')} />
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				{/* <Button primary disabled={!value || value.length === 0} onClick={onClickSave}>{t('Add_users')}</Button> */}
			</VerticalBar.Footer>
		</>
	);
};
