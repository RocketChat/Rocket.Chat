import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';
import { useEffect, useState } from 'react';

import { isMedsensePetEnabled, MEDSENSE_PET_ENABLED_EVENT, setMedsensePetEnabled } from '../../views/medsense/pet/petPreference';

type NavBarItemMedsensePetToggleProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemMedsensePetToggle = (props: NavBarItemMedsensePetToggleProps) => {
	const [enabled, setEnabled] = useState(isMedsensePetEnabled);

	useEffect(() => {
		const handleEnabledChange = (event: Event) => {
			const { detail } = event as CustomEvent<{ enabled?: boolean }>;
			setEnabled(detail?.enabled ?? isMedsensePetEnabled());
		};

		window.addEventListener(MEDSENSE_PET_ENABLED_EVENT, handleEnabledChange);
		window.addEventListener('storage', handleEnabledChange);

		return () => {
			window.removeEventListener(MEDSENSE_PET_ENABLED_EVENT, handleEnabledChange);
			window.removeEventListener('storage', handleEnabledChange);
		};
	}, []);

	const handleToggle = () => {
		setMedsensePetEnabled(!enabled);
	};

	return (
		<NavBarItem
			{...props}
			data-medsense-pet-toggle='true'
			data-medsense-pet-enabled={enabled ? 'true' : 'false'}
			icon={enabled ? 'bell' : 'bell-off'}
			title={enabled ? 'Disable notification pet' : 'Enable notification pet'}
			pressed={enabled}
			onClick={handleToggle}
		/>
	);
};

export default NavBarItemMedsensePetToggle;
