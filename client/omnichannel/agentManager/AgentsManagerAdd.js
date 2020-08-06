import React, { useCallback, useState } from 'react';
import { TextInput, Button, Box } from '@rocket.chat/fuselage';

import { useEndpointAction } from '../../hooks/useEndpointAction';
import { useTranslation } from '../../contexts/TranslationContext';

function AgentsManagerAdd({ setCache, type }) {
	const t = useTranslation();
	const [username, setUsername] = useState('');
	const handleChange = useCallback((event) => setUsername(event.currentTarget.value), []);


	const saveAction = useEndpointAction('POST', `livechat/users/${ type }`, { username });

	const handleSave = useCallback(async () => {
		if (username) {
			const result = await saveAction();
			if (result.success === true) {
				setCache(new Date());
				setUsername('');
			}
		}
	}, [username, saveAction, setCache]);
	return <Box display='flex' alignItems='center'>
		<TextInput value={username} onSubmit={handleSave} onChange={handleChange} maxWidth={400} /><Button onClick={handleSave} marginInlineStart={4} primary margin>{t('Add')}</Button>
	</Box>;
}

export default AgentsManagerAdd;
