import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import { useTranslation, useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import { VirtuosoScrollbars } from '../../components/CustomScrollbars';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import Row from '../search/Row';
import { useSearchItems } from './hooks/useSearchItems';

export const SearchForm = () => {
	const t = useTranslation();
	const listRef = useRef<VirtuosoHandle>(null);

	const {
		formState: { isDirty },
		register,
		watch,
	} = useForm({ defaultValues: { filterText: '' } });
	const { filterText } = watch();

	const { data: items = [], isLoading } = useSearchItems(filterText);

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const useRealName = useSetting('UI_Use_Real_Name');

	const sideBarItemTemplate = useTemplateByViewMode();
	const avatarTemplate = useAvatarTemplate();

	const extended = sidebarViewMode === 'extended';

	const itemData = useMemo(
		() => ({
			items,
			t,
			SideBarItemTemplate: sideBarItemTemplate,
			avatarTemplate,
			useRealName,
			extended,
			sidebarViewMode,
		}),
		[avatarTemplate, extended, items, useRealName, sideBarItemTemplate, sidebarViewMode, t],
	);

	return (
		<>
			<TextInput {...register('filterText')} placeholder={t('Search')} role='search' addon={<Icon name='magnifier' size='x20' />} />
			{isDirty && (
				<Box
					// ref={boxRef}
					role='listbox'
					// id={listId}
					tabIndex={-1}
					flexShrink={1}
					h='full'
					w='full'
					data-qa='sidebar-search-result'
					aria-live='polite'
					aria-atomic='true'
					aria-busy={isLoading}
					// onClick={handleClick}
				>
					<Virtuoso
						style={{ height: '100%', width: '100%' }}
						totalCount={items.length}
						data={items}
						components={{ Scroller: VirtuosoScrollbars }}
						computeItemKey={(_, room) => room._id}
						itemContent={(_, data): ReactElement => <Row data={itemData} item={data} />}
						ref={listRef}
					/>
				</Box>
			)}
		</>
	);
};
