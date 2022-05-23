import { Box, Tag } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useMethod } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect, useState } from 'react';

import { ILicenseTag } from '../../ee/app/license/definitions/ILicenseTag';

function PlanTag(): ReactElement {
	const [plans, setPlans] = useSafely(
		useState<
			{
				name: string;
				color: string;
			}[]
		>([]),
	);

	const getTags = useMethod('license:getTags');

	useEffect(() => {
		const developmentTag = process.env.NODE_ENV === 'development' ? { name: 'development', color: '#095ad2' } : null;

		const fetchTags = async (): Promise<void> => {
			const tags = await getTags();
			setPlans([developmentTag, ...tags].filter(Boolean) as ILicenseTag[]);
		};

		fetchTags();
	}, [getTags, setPlans]);

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
