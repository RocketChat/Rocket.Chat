import { Button, Box, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAutoComplete } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from '../../../../hooks/useEndpointMutation';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

const AddAgent = () => {
	const { t } = useTranslation();
	const [username, setUsername] = useState('');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const usernameFieldId = useId();

	const { mutateAsync: saveAction } = useEndpointMutation('POST', '/v1/livechat/users/agent', {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.agents() });
			setUsername('');
			dispatchToastMessage({ type: 'success', message: t('Agent_added') });
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
						{t('Add_agent')}
					</Button>
				</FieldRow>
			</Field>
		</Box>
	);
};

export default AddAgent;
