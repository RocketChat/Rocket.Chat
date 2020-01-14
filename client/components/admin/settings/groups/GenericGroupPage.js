import React from 'react';

import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function GenericGroupPage({ _id, sections, ...group }) {
	const solo = sections.length === 1;

	return <GroupPage _id={_id} {...group}>
		{sections.map((sectionName) => <Section
			key={sectionName}
			groupId={_id}
			sectionName={sectionName}
			solo={solo}
		/>)}
	</GroupPage>;
}
