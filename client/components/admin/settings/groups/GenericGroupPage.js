import React from 'react';

import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function GenericGroupPage({ group }) {
	const solo = group.sections.length === 1;

	return <GroupPage group={group}>
		{group.sections.map((sectionName) => <Section
			key={sectionName}
			groupId={group._id}
			sectionName={sectionName}
			solo={solo}
		/>)}
	</GroupPage>;
}
