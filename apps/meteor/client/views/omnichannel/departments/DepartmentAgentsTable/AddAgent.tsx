import { Box, Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { AriaAttributes } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../../../components/AutoCompleteAgent';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import type { IDepartmentAgent } from '../definitions';

type AddAgentProps = Pick<AriaAttributes, 'aria-labelledby'> & {
	agentList: IDepartmentAgent[];
	onAdd: (agent: IDepartmentAgent) => void;
};

function AddAgent({ agentList, onAdd, 'aria-labelledby': ariaLabelledBy }: AddAgentProps) {
	const { t } = useTranslation();

	const [userId, setUserId] = useState('');

	const getAgent = useEndpointAction('GET', '/v1/livechat/users/agent/:_id', { keys: { _id: userId } });

	const dispatchToastMessage = useToastMessageDispatch();

	const handleAgent = useEffectEvent((e: string) => setUserId(e));

	const handleSave = useEffectEvent(async () => {
		if (!userId) {
			return;
		}

		const {
			user: { _id, username, name },
		} = await getAgent();

		if (!agentList.some(({ agentId }) => agentId === _id)) {
			setUserId('');
			onAdd({ agentId: _id, username: username ?? '', name, count: 0, order: 0 });
		} else {
			dispatchToastMessage({ type: 'error', message: t('This_agent_was_already_selected') });
		}
	});

	return (
		<Box role='group' aria-labelledby={ariaLabelledBy} display='flex' alignItems='center'>
			<AutoCompleteAgent value={userId} onChange={handleAgent} />
			<Button disabled={!userId} onClick={handleSave} mis={8} primary>
				{t('Add')}
			</Button>
		</Box>
	);
}

export default AddAgent;
