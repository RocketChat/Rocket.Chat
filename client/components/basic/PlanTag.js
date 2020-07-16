import React, { useMemo, useState } from 'react';
import { Tag, Box } from '@rocket.chat/fuselage';

import { useMethod } from '../../contexts/ServerContext';

function PlanTag() {
	const [plans, setPlans] = useState([]);
	const [background, setBackground] = useState([]);

	const getTags = useMethod('license:getTags');

	useMemo(() => {
		const loadTags = async () => {
			setPlans(await getTags());
		};
		loadTags();
	}, [getTags]);

	useMemo(() => {
		const currBg = [];
		plans.forEach((plan, i) => {
			switch (plan) {
				case 'bronze':
					currBg[i] = '#BD5A0B';
					break;
				case 'silver':
					currBg[i] = '#9EA2A8';
					break;
				case 'gold':
					currBg[i] = '#F3BE08';
					break;
				default:
					currBg[i] = '#2F343D';
					break;
			}
		});
		setBackground(currBg);
	}, [plans]);

	return <Box>
		{plans.map((plan, i) => <Tag key={plan} backgroundColor={background[i]} marginInlineStart='x8' color='#fff' textTransform='capitalize'>{plan}</Tag>) }
	</Box>;
}

export default PlanTag;
