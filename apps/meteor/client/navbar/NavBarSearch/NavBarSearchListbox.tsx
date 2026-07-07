import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { Box, Tile } from '@rocket.chat/fuselage';
import { useStableCallback, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchItemSkeleton from './NavBarSearchItemSkeleton';
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

	const handleSelect = useStableCallback(() => {
		state.close();
		resetField('filterText');
	});

	const { items, isLoading } = useSearchItems(filterText);

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
			<ResultsLiveRegion shouldAnnounce={!isLoading} itemCount={items.length} isLoading={isLoading} />
			<CustomScrollbars>
				<div {...overlayProps} role='listbox' aria-label={t('Channels')} aria-busy={isLoading} tabIndex={-1} onKeyDown={handleKeyDown}>
					{items.length === 0 && !isLoading && <NavBarSearchNoResults />}
					{items.length > 0 && (
						<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4} role='presentation' aria-hidden>
							{filterText ? t('Results') : t('Recent')}
						</Box>
					)}
					{items.map((item) => (
						<NavBarSearchRow key={item._id} room={item} onClick={handleSelect} />
					))}
					{isLoading && Array.from({ length: 4 }, (_, index) => <NavBarSearchItemSkeleton key={`skeleton-${index}`} />)}
				</div>
			</CustomScrollbars>
		</Tile>
	);
};

export default NavBarSearchListBox;
