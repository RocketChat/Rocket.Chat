import { Select } from '@rocket.chat/fuselage';
import React, { ComponentProps, forwardRef } from 'react';

import { FreePaidDropDownGroup } from '../definitions/FreePaidDropDownDefinitions';

const FreePaidDropDownAnchor = forwardRef<HTMLElement, Partial<ComponentProps<typeof Select>> & { group?: FreePaidDropDownGroup }>(
	function FreePaidDropDownAnchor(props, ref) {
		const selectedFilter = props.group && props.group.items.find((item) => item.checked)?.label;

		return <Select ref={ref} placeholder={selectedFilter} options={[]} onChange={(): number => 0} {...props} />;
	},
);

export default FreePaidDropDownAnchor;
