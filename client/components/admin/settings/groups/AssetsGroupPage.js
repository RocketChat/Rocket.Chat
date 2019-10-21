import { Button } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../providers/TranslationProvider';
import { useGroup } from '../EditingState';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function AssetsGroupPage() {
	const group = useGroup();
	const t = useTranslation();

	return <GroupPage headerButtons={<>
		<Button className='refresh-clients'>{t('Apply_and_refresh_all_clients')}</Button>
	</>}>
		{group.sections.map((section) =>
			<Section key={section.name} hasReset={false} section={section} solo={group.sections.length === 1} />)}
	</GroupPage>;
}
