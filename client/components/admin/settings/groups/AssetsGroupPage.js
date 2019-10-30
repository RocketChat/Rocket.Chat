import { Button } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../providers/TranslationProvider';
import { GroupPage } from '../GroupPage';
import { useGroup } from '../GroupState';
import { Section } from '../Section';
import { SectionState } from '../SectionState';

export function AssetsGroupPage() {
	const group = useGroup();
	const solo = group.sections.length === 1;
	const t = useTranslation();

	return <GroupPage headerButtons={<>
		<Button className='refresh-clients'>{t('Apply_and_refresh_all_clients')}</Button>
	</>}>
		{group.sections.map((section) => <SectionState key={section} section={section}>
			<Section hasReset={false} solo={solo} />
		</SectionState>)}
	</GroupPage>;
}
