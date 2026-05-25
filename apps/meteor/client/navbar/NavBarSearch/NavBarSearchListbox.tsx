import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { Box, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useCallback, useRef } from 'react';
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

	const handleSelect = useCallback(() => {
		state.close();
		resetField('filterText');
	}, [resetField, state]);

	const { data: items = { rooms: [], intelligent: [] }, isLoading } = useSearchItems(debouncedFilter);
	const itemCount = items.rooms.length + items.intelligent.length;

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
					{items.intelligent.length > 0 && (
						<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} pbs={8} mbe={4} role='presentation' aria-hidden>
							{t('Intelligent_Search')}
						</Box>
					)}
					{items.intelligent.map((item) => (
						<NavBarSearchMessageRow key={`intelligent-${item._id}`} type='intelligent' item={item} onClick={handleSelect} />
					))}
					{items.rooms.length > 0 && (
						<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4} role='presentation' aria-hidden>
							{filterText ? t('Results') : t('Recent')}
						</Box>
					)}
					{items.rooms.map((item) => (
						<NavBarSearchRow key={item._id} room={item} onClick={handleSelect} />
					))}
				</div>
			</CustomScrollbars>
		</Tile>
	);
};

export default NavBarSearchListBox;
