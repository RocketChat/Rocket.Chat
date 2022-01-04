import { Box, NumberInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

function Count({ agentId, setAgentList, agentList }) {
	const t = useTranslation();
	const [agentCount, setAgentCount] = useState(agentList.find((agent) => agent.agentId === agentId).count || 0);

	const handleCount = useMutableCallback(async (e) => {
		const countValue = Number(e.currentTarget.value);
		setAgentCount(countValue);
		setAgentList(
			agentList.map((agent) => {
				if (agent.agentId === agentId) {
					agent.count = countValue;
				}
				return agent;
			}),
		);
	});

	return (
		<Box display='flex'>
			<NumberInput flexShrink={1} key={`${agentId}-count`} title={t('Count')} value={agentCount} onChange={handleCount} />
		</Box>
	);
}

export default Count;
