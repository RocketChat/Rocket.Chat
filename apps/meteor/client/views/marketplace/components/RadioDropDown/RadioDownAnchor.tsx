import { SelectLegacy } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef } from 'react';

import type { RadioDropDownGroup } from '../../definitions/RadioDropDownDefinitions';

const RadioDownAnchor = forwardRef<HTMLInputElement, Partial<ComponentProps<typeof SelectLegacy>> & { group: RadioDropDownGroup }>(
	function SortDropDownAnchor(props, ref) {
		const { group } = props;

		const selectedFilter = group?.items.find((item) => item.checked)?.label;

		return <SelectLegacy ref={ref} placeholder={selectedFilter} options={[]} onChange={(): number => 0} color='hint' {...props} />;
	},
);

export default RadioDownAnchor;
