import React, { useCallback, useState, useMemo, useContext, useEffect } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Select, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { CurrentStatusContext } from './CustomUserStatusRoute';

export function EditCustomUserStatus({ close, setCache, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { currentStatus } = useContext(CurrentStatusContext);
	const { _id, name: previousName, statusType: previousStatusType } = currentStatus;

	const [name, setName] = useState('');
	const [statusType, setStatusType] = useState('');

	useEffect(() => {
		setName(previousName || '');
		setStatusType(previousStatusType || '');
	}, [previousName, previousStatusType, _id]);

	const saveStatus = useMethod('insertOrUpdateUserStatus');
	const deleteStatus = useMethod('deleteCustomUserStatus');

	const hasUnsavedChanges = useMemo(() => previousName !== name || previousStatusType !== statusType, [name, statusType]);
	const handleSave = useCallback(async () => {
		try {
			await saveStatus({
				_id,
				previousName,
				previousStatusType,
				name,
				statusType,
			});
			dispatchToastMessage({ type: 'success', message: t('Custom_User_Status_Updated_Successfully') });
			setCache(new Date());
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [name, statusType, _id]);

	const handleDelete = useCallback(async () => {
		try {
			await deleteStatus(_id);
			dispatchToastMessage({ type: 'success', message: t('Custom_User_Status_Has_Been_Deleted') });
			setCache(new Date());
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [_id]);

	const presenceOptions = [
		['away', t('Away')],
		['online', t('Online')],
		['busy', t('Busy')],
		['offline', t('Offline')],
	];

	return <Box display='flex' flexDirection='column' textStyle='p1' textColor='default' mbs='x20' {...props}>
		<Margins block='x4'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Presence')}</Field.Label>
				<Field.Row>
					<Select value={statusType} onChange={(value) => setStatusType(value)} placeholder={t('Presence')} options={presenceOptions}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button primary danger mie='x4' onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button primary danger mie='x4' onClick={handleDelete}><Icon name='trash' mie='x4'/>{t('Delete')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</Margins>
	</Box>;
}