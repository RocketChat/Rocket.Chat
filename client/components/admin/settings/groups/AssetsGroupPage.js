import { Button } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../providers/TranslationProvider';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';
import { SectionState } from '../SectionState';

export function AssetsGroupPage({ group }) {
	const solo = group.sections.length === 1;
	const t = useTranslation();

	return <GroupPage group={group} headerButtons={<>
		<Button className='refresh-clients'>{t('Apply_and_refresh_all_clients')}</Button>
	</>}>
		{group.sections.map((section) => <SectionState key={section} group={group} section={section}>
			<Section hasReset={false} solo={solo} />
		</SectionState>)}
	</GroupPage>;
}
