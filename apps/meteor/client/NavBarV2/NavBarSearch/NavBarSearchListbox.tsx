import { Box, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useRef } from 'react';
import type { OverlayTriggerAria } from 'react-aria';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { OverlayTriggerState } from 'react-stately';

import NavBarSearchNoResults from './NavBarSearchNoResults';
import NavBarSearchRow from './NavBarSearchRow';
import { useSearchItems } from './hooks/useSearchItems';
import { useListboxNavigation } from './hooks/useSearchNavigation';
import { CustomScrollbars } from '../../components/CustomScrollbars';

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

	const debouncedFilter = useDebouncedValue(filterText, 200);

	const handleSelect = useEffectEvent(() => {
		state.close();
		resetField('filterText');
	});

	const { data: items = [], isLoading } = useSearchItems(debouncedFilter);

	return (
		<Tile
			ref={containerRef}
			position='absolute'
			zIndex={99}
			padding={0}
			pb={16}
			minHeight='x52'
			maxHeight='50vh'
			display='flex'
			width='100%'
			flexDirection='column'
			aria-live='polite'
			aria-atomic='true'
			aria-busy={isLoading}
		>
			<CustomScrollbars>
				<div {...overlayProps} role='listbox' aria-label={t('Channels')} tabIndex={-1} onKeyDown={handleKeyDown}>
					{items.length === 0 && !isLoading && <NavBarSearchNoResults />}
					{items.length > 0 && (
						<Box color='title-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4}>
							{filterText ? t('Results') : t('Recent')}
						</Box>
					)}
					{items.map((item) => (
						<div key={item._id}>
							<NavBarSearchRow room={item} onClick={handleSelect} />
						</div>
					))}
				</div>
			</CustomScrollbars>
		</Tile>
	);
};

export default NavBarSearchListBox;
