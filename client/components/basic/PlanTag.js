import React, { useMemo, useState } from 'react';
import { Tag } from '@rocket.chat/fuselage';

import { useMethod } from '../../contexts/ServerContext';

function PlanTag() {
	const [plan, setPlan] = useState('');
	const [background, setBackground] = useState('#2F343D');

	const getTags = useMethod('license:getTags');

	useMemo(() => {
		const loadTags = async () => {
			setPlan(await getTags());
		};
		loadTags();
	}, [getTags]);

	useMemo(() => {
		const selectBg = async () => {
			switch (await plan[0]) {
				case 'bronze':
					setBackground('#BD5A0B');
					break;
				case 'silver':
					setBackground('#9EA2A8');
					break;
				case 'gold':
					setBackground('#F3BE08');
					break;
			}
		};

		selectBg();
	}, [plan]);

	return <Tag backgroundColor={background} marginInlineStart='x8' color='#fff' textTransform='captalize' >{plan}</Tag>;
}

export default PlanTag;
