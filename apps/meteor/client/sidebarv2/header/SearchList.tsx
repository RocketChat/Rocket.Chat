import { Box } from '@rocket.chat/fuselage';
import { useTranslation, useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler, ReactElement } from 'react';
import React, { useMemo, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { VirtuosoScrollbars } from '../../components/CustomScrollbars';
import RoomListWrapper from '../RoomList/RoomListWrapper';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import Row from '../search/Row';
import { useSearchItems } from './hooks/useSearchItems';

type SearchListProps = { filterText: string; onEscSearch: () => void };

const SearchList = ({ filterText, onEscSearch }: SearchListProps) => {
	const t = useTranslation();

	const boxRef = useRef<HTMLDivElement>(null);
	usePreventDefault(boxRef);

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
			SidebarItemTemplate: sideBarItemTemplate,
			avatarTemplate,
			useRealName,
			extended,
			sidebarViewMode,
		}),
		[avatarTemplate, extended, items, useRealName, sideBarItemTemplate, sidebarViewMode, t],
	);

	const handleClick: MouseEventHandler<HTMLElement> = (e): void => {
		if (e.target instanceof Element && [e.target.tagName, e.target.parentElement?.tagName].includes('BUTTON')) {
			return;
		}
		return onEscSearch();
	};

	return (
		<Box
			ref={boxRef}
			role='listbox'
			tabIndex={-1}
			flexShrink={1}
			h='full'
			w='full'
			pbs={8}
			aria-live='polite'
			aria-atomic='true'
			aria-busy={isLoading}
			onClick={handleClick}
		>
			<Virtuoso
				style={{ height: '100%', width: '100%' }}
				totalCount={items.length}
				data={items}
				components={{ List: RoomListWrapper, Scroller: VirtuosoScrollbars }}
				computeItemKey={(_, room) => room._id}
				itemContent={(_, data): ReactElement => <Row data={itemData} item={data} />}
			/>
		</Box>
	);
};

export default SearchList;
