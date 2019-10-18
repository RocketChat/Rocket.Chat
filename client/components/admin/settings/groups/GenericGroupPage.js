import React from 'react';

import { useGroup } from '../EditingState';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function GenericGroupPage() {
	const group = useGroup();

	return <GroupPage>
		{group.sections.map((section) => <Section key={section.name} section={section} />)}
	</GroupPage>;
}
