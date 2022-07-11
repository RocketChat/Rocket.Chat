import { Box, Tag } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { ILicenseTag } from '../../ee/app/license/definitions/ILicenseTag';

type PlanTagType = {
	name: string;
	color: string;
};

function PlanTag(): ReactElement {
	const [plans, setPlans] = useSafely(useState<PlanTagType[]>([]));

	const isEnterpriseEdition = useEndpoint('GET', '/v1/licenses.isEnterprise');
	const { data } = useQuery(['licenses.isEnterprise'], () => isEnterpriseEdition(), {
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		const developmentTag = process.env.NODE_ENV === 'development' ? { name: 'development', color: '#095ad2' } : null;
		const enterpriseTag = data?.isEnterprise ? { name: 'enterprise', color: '#095ad2' } : null;

		setPlans([developmentTag, enterpriseTag].filter(Boolean) as ILicenseTag[]);
	}, [setPlans, data?.isEnterprise]);

	return (
		<>
			{plans.map(({ name, color }) => (
				<Box marginInline='x4' display='inline-block' verticalAlign='middle' key={name}>
					<Tag
						style={{
							color: '#fff',
							backgroundColor: color,
							textTransform: 'capitalize',
						}}
					>
						{name}
					</Tag>
				</Box>
			))}
		</>
	);
}

export default PlanTag;
