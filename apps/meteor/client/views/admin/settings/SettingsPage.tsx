import { Icon, SearchInput, CardGrid } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SettingsGroupCard from './SettingsGroupCard';
import { useSettingsGroups } from './hooks/useSettingsGroups';
import GenericNoResults from '../../../components/GenericNoResults';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import PageBlockWithBorder from '../../../components/Page/PageBlockWithBorder';

const SettingsPage = (): ReactElement => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setFilter(e.currentTarget.value), []);

	const groups = useSettingsGroups(useDebouncedValue(filter, 400));

	return (
		<Page background='tint'>
			<PageHeader title={t('Settings')} borderBlockEndColor='' />
			<PageBlockWithBorder>
				<SearchInput value={filter} placeholder={t('Search')} onChange={handleChange} addon={<Icon name='magnifier' size='x20' />} />
			</PageBlockWithBorder>

			<PageScrollableContentWithShadow p={0} mi={24} mbe={16}>
				<CardGrid
					breakpoints={{
						xs: 4,
						sm: 4,
						md: 4,
						lg: 6,
						xl: 4,
						p: 8,
					}}
				>
					{!!groups.length &&
						groups.map((group) => (
							<SettingsGroupCard
								key={group._id}
								id={group._id}
								title={group.i18nLabel as TranslationKey}
								description={group.i18nDescription as TranslationKey}
							/>
						))}
				</CardGrid>

				{!groups.length && <GenericNoResults />}
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default SettingsPage;
