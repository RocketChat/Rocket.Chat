import { Icon, SearchInput, Skeleton, CardGroup } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useIsSettingsContextLoading, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState } from 'react';

import GenericNoResults from '../../../components/GenericNoResults';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import PageBlockWithBorder from '../../../components/Page/PageBlockWithBorder';
import SettingsGroupCard from './SettingsGroupCard';
import { useSettingsGroups } from './hooks/useSettingsGroups';

const SettingsPage = (): ReactElement => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const handleChange = useCallback((e) => setFilter(e.currentTarget.value), []);

	const groups = useSettingsGroups(useDebouncedValue(filter, 400));
	const isLoadingGroups = useIsSettingsContextLoading();

	return (
		<Page background='tint'>
			<PageHeader title={t('Settings')} borderBlockEndColor='' />
			<PageBlockWithBorder>
				<SearchInput value={filter} placeholder={t('Search')} onChange={handleChange} addon={<Icon name='magnifier' size='x20' />} />
			</PageBlockWithBorder>

			<PageScrollableContentWithShadow p={0} mi={16}>
				{isLoadingGroups && <Skeleton />}
				<CardGroup wrap stretch>
					{!isLoadingGroups &&
						!!groups.length &&
						groups.map((group) => (
							<SettingsGroupCard
								key={group._id}
								id={group._id}
								title={group.i18nLabel as TranslationKey}
								description={group.i18nDescription as TranslationKey}
							/>
						))}
				</CardGroup>

				{!isLoadingGroups && !groups.length && <GenericNoResults />}
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default SettingsPage;
