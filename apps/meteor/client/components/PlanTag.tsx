import { Box, Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useEffect, useState } from 'react';

import { isTruthy } from '../../lib/isTruthy';
import { useIsEnterprise } from '../hooks/useIsEnterprise';

function PlanTag(): ReactElement {
	const [plans, setPlans] = useState<string[]>([]);

	const { data } = useIsEnterprise();

	useEffect(() => {
		const developmentTag = process.env.NODE_ENV === 'development' ? 'Development' : null;
		const enterpriseTag = data?.isEnterprise ? 'Enterprise' : null;

		setPlans([developmentTag, enterpriseTag].filter(isTruthy));
	}, [setPlans, data?.isEnterprise]);

	return (
		<>
			{plans.map((name) => (
				<Box marginInline='x4' display='inline-block' verticalAlign='middle' key={name}>
					<Tag variant='primary'>{name}</Tag>
				</Box>
			))}
		</>
	);
}

export default PlanTag;
