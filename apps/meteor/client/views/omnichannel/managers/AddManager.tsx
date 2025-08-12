import { Button, Box, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAutoComplete } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from '../../../hooks/useEndpointMutation';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';

const AddManager = (): ReactElement => {
	const { t } = useTranslation();
	const [username, setUsername] = useState('');
	const dispatchToastMessage = useToastMessageDispatch();

	const usernameFieldId = useId();

	const queryClient = useQueryClient();

	const { mutateAsync: saveAction } = useEndpointMutation('POST', '/v1/livechat/users/manager', {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.managers() });
			setUsername('');
			dispatchToastMessage({ type: 'success', message: t('Manager_added') });
		},
	});

	const handleSave = useEffectEvent(async () => {
		await saveAction({ username });
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
