import React, { useCallback, useState } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Select } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

export function AddCustomUserStatus({ goToNew, close, setCache, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [statusType, setStatusType] = useState('online');

	const saveStatus = useMethod('insertOrUpdateUserStatus');
	const handleSave = useCallback(async () => {
		try {
			const result = await saveStatus({
				name,
				statusType,
			});
			dispatchToastMessage({ type: 'success', message: t('Custom_User_Status_Updated_Successfully') });
			setCache(new Date());
			goToNew(result)();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [name, statusType]);

	const presenceOptions = [
		['online', t('Online')],
		['busy', t('Busy')],
		['away', t('Away')],
		['offline', t('Offline')],
	];

	return <Box display='flex' flexDirection='column' fontScale='p1' color='default' mbs='x20' {...props}>
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
						<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={name === ''}>{t('Save')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</Margins>
	</Box>;
}
