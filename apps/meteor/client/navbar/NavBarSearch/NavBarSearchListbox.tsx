import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { Box, ItemGroupHeader, ItemGroupTitle, PopoverSurface } from '@rocket.chat/fuselage';
import { useStableCallback, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchItemSkeleton from './NavBarSearchItemSkeleton';
import NavBarSearchNoResults from './NavBarSearchNoResults';
import NavBarSearchRow from './NavBarSearchRow';
import { useSyncSearchOptions } from './hooks/useSearchActiveOption';
import { useSearchItems } from './hooks/useSearchItems';
import ResultsLiveRegion from '../../components/ResultsLiveRegion';

export type NavBarSearchListBoxProps = {
	state: OverlayTriggerState;
	overlayProps: OverlayTriggerAria['overlayProps'];
};

const NavBarSearchListBox = ({ state, overlayProps }: NavBarSearchListBoxProps) => {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLElement>(null);

	useOutsideClick([containerRef], state.close);

	const { resetField, watch } = useFormContext();
	const { filterText } = watch();

	const handleSelect = useStableCallback(() => {
		state.close();
		resetField('filterText');
	});

	const { items, isLoading } = useSearchItems(filterText);
	useSyncSearchOptions(items);

	return (
		<Box ref={containerRef} position='absolute' zIndex={99} marginBlockStart={4} width='100%'>
			<PopoverSurface elevation='1' maxHeight='half-screen'>
				<ResultsLiveRegion shouldAnnounce={!isLoading} itemCount={items.length} isLoading={isLoading} />
				<CustomScrollbars>
					<div
						{...overlayProps}
						role='listbox'
						aria-label={t('Channels')}
						aria-busy={isLoading}
						tabIndex={-1}
						onMouseDown={(event) => event.preventDefault()}
					>
						{items.length === 0 && !isLoading && <NavBarSearchNoResults />}
						{items.length > 0 && (
							<ItemGroupHeader inset='md' aria-hidden>
								<ItemGroupTitle>{filterText ? t('Results') : t('Recent')}</ItemGroupTitle>
							</ItemGroupHeader>
						)}
						{items.map((item) => (
							<NavBarSearchRow key={item._id} room={item} onClick={handleSelect} />
						))}
						{isLoading && Array.from({ length: 4 }, (_, index) => <NavBarSearchItemSkeleton key={`skeleton-${index}`} />)}
					</div>
				</CustomScrollbars>
			</PopoverSurface>
		</Box>
	);
};

export default NavBarSearchListBox;
