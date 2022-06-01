import { Button, Box, Field } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, FC } from 'react';

import UserAutoComplete from '../../../components/UserAutoComplete';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

type AddAgentProps = {
	reload: () => void;
	pi?: 'x24';
};

const AddAgent: FC<AddAgentProps> = ({ reload, ...props }) => {
	const t = useTranslation();
	const [username, setUsername] = useState('');

	const saveAction = useEndpointAction('POST', 'livechat/users/agent', { username });

	const handleSave = useMutableCallback(async () => {
		if (!username) {
			return;
		}
		const result = await saveAction();
		if (!result.success) {
			return;
		}
		reload();
		setUsername(username);
	});
	return (
		<Box display='flex' alignItems='center' {...props}>
			<Field>
				<Field.Label>{t('Username')}</Field.Label>
				<Field.Row>
					<UserAutoComplete value={username} onChange={(username: string): void => setUsername(username)} />
					<Button disabled={!username} onClick={handleSave} mis='x8' primary>
						{t('Add')}
					</Button>
				</Field.Row>
			</Field>
		</Box>
	);
};

export default AddAgent;
