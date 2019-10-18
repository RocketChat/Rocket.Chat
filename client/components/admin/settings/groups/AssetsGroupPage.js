import React from 'react';

import { Button } from '../../../basic/Button';
import { useTranslation } from '../../../providers/TranslationProvider';
import { useGroup } from '../EditingState';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function AssetsGroupPage() {
	const group = useGroup();
	const t = useTranslation();

	return <GroupPage headerButtons={<>
		<Button secondary className='refresh-clients'>{t('Apply_and_refresh_all_clients')}</Button>
	</>}>
		{group.sections.map((section) => <Section key={section.name} section={section} hasReset={false} />)}
	</GroupPage>;
}
