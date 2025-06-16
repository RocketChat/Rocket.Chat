import { Button, Box, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAutoComplete } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '../../../hooks/useEndpointAction';

const AddManager = ({ reload }: { reload: () => void }): ReactElement => {
	const { t } = useTranslation();
	const [username, setUsername] = useState('');
	const dispatchToastMessage = useToastMessageDispatch();

	const usernameFieldId = useId();

	const saveAction = useEndpointAction('POST', '/v1/livechat/users/manager');

	const handleSave = useEffectEvent(async () => {
		try {
			await saveAction({ username });
			dispatchToastMessage({ type: 'success', message: t('Manager_added') });
			reload();
			setUsername('');
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
				<FieldLabel htmlFor={usernameFieldId}>{t('Username')}</FieldLabel>
				<FieldRow>
					<UserAutoComplete id={usernameFieldId} value={username} onChange={handleChange} />
					<Button disabled={!username} onClick={handleSave} mis={8} primary>
						{t('Add_manager')}
					</Button>
				</FieldRow>
			</Field>
		</Box>
	);
};

export default AddManager;
