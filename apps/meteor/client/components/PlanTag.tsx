import { Box, Tag } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { isTruthy } from '../../lib/isTruthy';

function PlanTag(): ReactElement {
	const [plans, setPlans] = useState<string[]>([]);

	const isEnterpriseEdition = useEndpoint('GET', '/v1/licenses.isEnterprise');
	const { data } = useQuery(['licenses.isEnterprise'], () => isEnterpriseEdition());

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
