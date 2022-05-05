import { Button, Box, Field } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import UserAutoComplete from '../../../components/UserAutoComplete';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

function AddAgent({ reload, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [username, setUsername] = useState();

	const saveAction = useEndpointAction('POST', 'livechat/users/agent', { username });

	const handleSave = useMutableCallback(async () => {
		if (!username) {
			return;
		}
		if (data?.users.find((user) => user.username === username)) {
			dispatchToastMessage({ type: 'error', message: t('Username_already_exist') });
			return;
		}
		const result = await saveAction();
		if (!result.success) {
			return;
		}
		reload();
		setUsername();
	});
	return (
		<Box display='flex' alignItems='center' {...props}>
			<Field>
				<Field.Label>{t('Username')}</Field.Label>
				<Field.Row>
					<UserAutoComplete value={username} onChange={setUsername} />
					<Button disabled={!username} onClick={handleSave} mis='x8' primary>
						{t('Add')}
					</Button>
				</Field.Row>
			</Field>
		</Box>
	);
}

export default AddAgent;
