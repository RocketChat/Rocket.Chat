import React, { useCallback, useState } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

export function AddCustomEmojis({ close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [aliases, setAliases] = useState('');

	const saveStatus = useMethod('insertOrUpdateUserStatus');
	const handleSave = useCallback(async () => {
		try {
			const result = await saveStatus({
				name,
				aliases,
			});
			dispatchToastMessage({ type: 'success', message: t('Custom_Emoji_Added_Successfully') });
			// goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Custom_Emoji_Error_Name_Or_Alias_Already_In_Use') });
		}
	}, [name, aliases]);

	// const presenceOptions = [
	// 	['online', t('Online')],
	// 	['busy', t('Busy')],
	// 	['away', t('Away')],
	// 	['offline', t('Offline')],
	// ];

	return <Box display='flex' flexDirection='column' fontScale='p1' color='default' mbs='x20' {...props}>
		<Margins block='x4'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Aliases')}</Field.Label>
				<Field.Row>
					<TextInput value={aliases} onChange={(e) => setAliases(e.currentTarget.value)} placeholder={t('Aliases')}/>
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
