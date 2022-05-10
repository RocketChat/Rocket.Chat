import { Box, Icon, SearchInput, Skeleton, Grid, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useIsSettingsContextLoading, TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, ReactElement } from 'react';

import Page from '../../../components/Page';
import SettingsGroupCard from './SettingsGroupCard';
import { useSettingsGroups } from './hooks/useSettingsGroups';

const SettingsPage = (): ReactElement => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const handleChange = useCallback((e) => setFilter(e.currentTarget.value), []);

	const groups = useSettingsGroups(useDebouncedValue(filter, 400));
	const isLoadingGroups = useIsSettingsContextLoading();

	return (
		<Page backgroundColor='neutral-100'>
			<Page.Header title={t('Settings')} />

			<Box mi='x24' display='flex' flexDirection='column'>
				<SearchInput value={filter} placeholder={t('Search')} onChange={handleChange} addon={<Icon name='magnifier' size='x20' />} />
			</Box>

			<Page.ScrollableContentWithShadow p='0'>
				<Box mb='x32' mi='x24'>
					{isLoadingGroups && <Skeleton />}
					<Grid width='full'>
						{!isLoadingGroups &&
							!!groups.length &&
							groups.map((group) => (
								<Grid.Item key={group._id} md={4} lg={4}>
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
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default SettingsPage;
