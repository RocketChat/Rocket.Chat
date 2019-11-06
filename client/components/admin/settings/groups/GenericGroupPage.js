import React from 'react';

import { GroupPage } from '../GroupPage';
import { Section } from '../Section';
import { SectionState } from '../SectionState';

export function GenericGroupPage({ group }) {
	const solo = group.sections.length === 1;

	return <GroupPage group={group}>
		{group.sections.map((section) => <SectionState key={section} group={group} section={section}>
			<Section solo={solo} />
		</SectionState>)}
	</GroupPage>;
}
