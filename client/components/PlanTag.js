import { Box, Tag } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useState } from 'react';

import { useMethod } from '../contexts/ServerContext';

function PlanTag() {
	const [plans, setPlans] = useSafely(useState([]));

	const getTags = useMethod('license:getTags');

	useEffect(() => {
		const developmentTag = process.env.NODE_ENV === 'development' ? { name: 'development', color: '#095ad2' } : null;

		const fetchTags = async () => {
			const tags = await getTags();
			setPlans([developmentTag, ...tags].filter(Boolean).map((plan) => ({ plan: plan.name, background: plan.color })));
		};

		fetchTags();
	}, [getTags, setPlans]);

	return plans.map(({ plan, background }) => (
		<Box marginInline='x4' display='inline-block' verticalAlign='middle' key={plan}>
			<Tag
				style={{
					color: '#fff',
					backgroundColor: background,
					textTransform: 'capitalize',
				}}
			>
				{plan}
			</Tag>
		</Box>
	));
}

export default PlanTag;
