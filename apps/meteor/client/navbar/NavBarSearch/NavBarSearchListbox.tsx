import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { Box, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchMessageRow from './NavBarSearchMessageRow';
import NavBarSearchNoResults from './NavBarSearchNoResults';
import NavBarSearchRow from './NavBarSearchRow';
import { useSearchItems } from './hooks/useSearchItems';
import { useListboxNavigation } from './hooks/useSearchNavigation';
import ResultsLiveRegion from '../../components/ResultsLiveRegion';

type NavBarSearchListBoxProps = {
	state: OverlayTriggerState;
	overlayProps: OverlayTriggerAria['overlayProps'];
};

const NavBarSearchListBox = ({ state, overlayProps }: NavBarSearchListBoxProps) => {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLElement>(null);

	const handleKeyDown = useListboxNavigation(state);
	useOutsideClick([containerRef], state.close);

	const { resetField, watch } = useFormContext();
	const { filterText } = watch();

	const debouncedFilter = useDebouncedValue(filterText, 500);

	const handleSelect = useEffectEvent(() => {
		state.close();
		resetField('filterText');
	});

	const { data, isLoading } = useSearchItems(debouncedFilter);
	const items = data ?? {
		recent: [],
		users: [],
		rooms: [],
		messages: [],
		intelligent: [],
		meta: {
			globalMessagesEnabled: false,
			intelligentSearchEnabled: false,
			intelligentSearchConfigured: false,
			hasIntelligentSearchLicense: false,
			showIntelligentSearch: false,
		},
	};
	const hasFilter = Boolean(filterText.trim());
	const itemCount = hasFilter
		? items.users.length + items.rooms.length + items.messages.length + items.intelligent.length
		: items.recent.length;

	const sectionLabel = (label: string) => (
		<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} pbs={8} mbe={4} role='presentation' aria-hidden>
			{label}
		</Box>
	);

	return (
		<Tile
			ref={containerRef}
			position='absolute'
			zIndex={99}
			padding={0}
			pb={16}
			mbs={4}
			minHeight='x52'
			maxHeight='50vh'
			display='flex'
			width='100%'
			flexDirection='column'
		>
			<ResultsLiveRegion shouldAnnounce={!isLoading} itemCount={itemCount} />
			<CustomScrollbars>
				<div {...overlayProps} role='listbox' aria-label={t('Channels')} aria-busy={isLoading} tabIndex={-1} onKeyDown={handleKeyDown}>
					{itemCount === 0 && !isLoading && <NavBarSearchNoResults />}
					{!hasFilter && items.recent.length > 0 && sectionLabel(t('Recent'))}
					{!hasFilter && items.recent.map((item) => <NavBarSearchRow key={item._id} room={item} onClick={handleSelect} />)}
					{hasFilter && items.users.length > 0 && sectionLabel(t('Users'))}
					{hasFilter && items.users.map((item) => <NavBarSearchRow key={`user-${item._id}`} room={item} onClick={handleSelect} />)}
					{hasFilter && items.rooms.length > 0 && sectionLabel(t('Rooms'))}
					{hasFilter &&
						items.rooms.map((item) => (
							<NavBarSearchRow key={`room-${item._id}`} room={item as SubscriptionWithRoom} onClick={handleSelect} />
						))}
					{hasFilter && items.messages.length > 0 && sectionLabel(t('Messages'))}
					{hasFilter &&
						items.messages.map((item) => (
							<NavBarSearchMessageRow key={`message-${item._id}`} type='message' item={item} onClick={handleSelect} />
						))}
					{hasFilter && items.intelligent.length > 0 && sectionLabel(t('Intelligent_Search'))}
					{hasFilter &&
						items.intelligent.map((item) => (
							<NavBarSearchMessageRow key={`intelligent-${item._id}`} type='intelligent' item={item} onClick={handleSelect} />
						))}
				</div>
			</CustomScrollbars>
		</Tile>
	);
};

export default NavBarSearchListBox;
