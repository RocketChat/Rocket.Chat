import { Button, Box, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAutoComplete } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '../../../../hooks/useEndpointAction';

type AddAgentProps = {
	reload: () => void;
};

const AddAgent = ({ reload }: AddAgentProps): ReactElement => {
	const { t } = useTranslation();
	const [username, setUsername] = useState('');
	const dispatchToastMessage = useToastMessageDispatch();

	const saveAction = useEndpointAction('POST', '/v1/livechat/users/agent');

	const handleSave = useEffectEvent(async () => {
		try {
			await saveAction({ username });
			reload();
			setUsername('');
			dispatchToastMessage({ type: 'success', message: t('Agent_added') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleChange = (value: unknown): void => {
		if (typeof value === 'string') {
			setUsername(value);
		}
	};

	return (
		<Box display='flex' alignItems='center'>
			<Field>
				<FieldLabel>{t('Username')}</FieldLabel>
				<FieldRow>
					<UserAutoComplete value={username} onChange={handleChange} />
					<Button disabled={!username} onClick={handleSave} mis={8} primary>
						{t('Add_agent')}
					</Button>
				</FieldRow>
			</Field>
		</Box>
	);
};

export default AddAgent;
