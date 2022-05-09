import { Box, Icon, SearchInput, Skeleton, Grid } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, ReactElement } from 'react';

import Page from '../../../components/Page';
import { useIsSettingsContextLoading } from '../../../contexts/SettingsContext';
import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';
import SettingsGroupCard from './SettingsGroupCard';
import { useSettingsGroups } from './hooks/useSettingsGroups';

const SettingsPage = (): ReactElement => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const handleChange = useCallback((e) => setFilter(e.currentTarget.value), []);

	const groups = useSettingsGroups(useDebouncedValue(filter, 400));
	const isLoadingGroups = useIsSettingsContextLoading();
	// const isLoadingGroups = false; // TODO: get from PrivilegedSettingsContext

	const isSmall = false;

	return (
		<Page backgroundColor='neutral-100'>
			<Page.Header title={t('Settings')} />

			<Box mi='x24' display='flex' flexDirection='column'>
				<SearchInput value={filter} placeholder={t('Search')} onChange={handleChange} addon={<Icon name='magnifier' size='x20' />} />
			</Box>

			<Page.ScrollableContentWithShadow p='0'>
				<Box mi='x24' display='flex' flexDirection='column'>
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
						<Box pi='x28' mb='x4' color='hint'>
							{t('Nothing_found')}
						</Box>
					)}
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default SettingsPage;
