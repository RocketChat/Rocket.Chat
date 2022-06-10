import { Box, NumberInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

function Order({ agentId, setAgentList, agentList }) {
	const t = useTranslation();
	const [agentOrder, setAgentOrder] = useState(agentList.find((agent) => agent.agentId === agentId).order || 0);

	const handleOrder = useMutableCallback(async (e) => {
		const orderValue = Number(e.currentTarget.value);
		setAgentOrder(orderValue);
		setAgentList(
			agentList.map((agent) => {
				if (agent.agentId === agentId) {
					agent.order = orderValue;
				}
				return agent;
			}),
		);
	});

	return (
		<Box display='flex'>
			<NumberInput flexShrink={1} key={`${agentId}-order`} title={t('Order')} value={agentOrder} onChange={handleOrder} />
		</Box>
	);
}

export default Order;
