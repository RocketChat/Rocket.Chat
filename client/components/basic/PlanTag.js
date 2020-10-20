import React, { useEffect, useState } from 'react';
import { Tag } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';

import { useMethod } from '../../contexts/ServerContext';

function PlanTag() {
	const [plans, setPlans] = useSafely(useState([]));

	const getTags = useMethod('license:getTags');

	useEffect(() => {
		(async () => {
			const tags = await getTags();
			setPlans([process.env.NODE_ENV === 'development' && { name: 'development', color: 'primary-600' }, ...tags].filter(Boolean).map((plan) => ({ plan: plan.name, background: plan.color })));
		})();
	}, []);

	return plans.map(({ plan, background }) => <Tag key={plan} verticalAlign='middle' backgroundColor={background} marginInline='x4' color='#fff' textTransform='capitalize'>{plan}</Tag>);
}

export default PlanTag;
