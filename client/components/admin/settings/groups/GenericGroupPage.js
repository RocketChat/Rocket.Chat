import React from 'react';

import { GroupPage } from '../GroupPage';
import { useGroup } from '../GroupState';
import { Section } from '../Section';
import { SectionState } from '../SectionState';

export function GenericGroupPage() {
	const group = useGroup();
	const solo = group.sections.length === 1;

	return <GroupPage>
		{group.sections.map((section) => <SectionState key={section} section={section}>
			<Section solo={solo} />
		</SectionState>)}
	</GroupPage>;
}
