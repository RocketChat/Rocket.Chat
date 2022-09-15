import { Icon, SearchInput, Skeleton, Grid, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useIsSettingsContextLoading, TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, ReactElement } from 'react';

import Page from '../../../components/Page';
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
			<Page.Header title={t('Settings')} borderBlockEndColor='' />

			<PageBlockWithBorder>
				<SearchInput value={filter} placeholder={t('Search')} onChange={handleChange} addon={<Icon name='magnifier' size='x20' />} />
			</PageBlockWithBorder>

			<Page.ScrollableContentWithShadow p='0'>
				{isLoadingGroups && <Skeleton />}
				<Grid mi='x16' mbe='x18'>
					{!isLoadingGroups &&
						!!groups.length &&
						groups.map((group) => (
							<Grid.Item key={group._id} xs={4} sm={4} md={4} lg={4} xl={3}>
								<SettingsGroupCard
									id={group._id}
									title={group.i18nLabel as TranslationKey}
									description={group.i18nDescription as TranslationKey}
								/>
							</Grid.Item>
						))}
				</Grid>
				{!isLoadingGroups && !groups.length && (
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>{t('No_results_found')}</StatesTitle>
					</States>
				)}
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default SettingsPage;
