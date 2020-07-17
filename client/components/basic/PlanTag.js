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
			const getBackgroundColor = (plan) => {
				switch (plan) {
					case 'bronze':
						return '#BD5A0B';
					case 'silver':
						return '#9EA2A8';
					case 'gold':
						return '#F3BE08';
					case 'development':
						return 'primary-600';
					default:
						return '#2F343D';
				}
			};
			setPlans([process.env.NODE_ENV === 'development' && 'development', ...tags].filter(Boolean).map((plan) => ({ plan, background: getBackgroundColor(plan) })));
		})();
	}, []);

	return plans.map(({ plan, background }) => <Tag key={plan} backgroundColor={background} marginInline='x4' color='#fff' textTransform='capitalize'>{plan}</Tag>);
}

export default PlanTag;
