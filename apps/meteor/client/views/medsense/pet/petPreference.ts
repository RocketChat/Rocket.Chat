export const MEDSENSE_PET_ENABLED_KEY = 'medsense_notification_pet_enabled';
export const MEDSENSE_PET_MODE_KEY = 'medsense_notification_pet_mode';
export const MEDSENSE_PET_SESSION_MODE_KEY = 'medsense_notification_pet_session_mode';
export const MEDSENSE_PET_ENABLED_EVENT = 'medsense-notification-pet-enabled-change';

export const isMedsensePetEnabled = (): boolean => {
	const storedMode = window.localStorage.getItem(MEDSENSE_PET_MODE_KEY);
	if (storedMode === 'off') {
		return false;
	}

	const stored = window.localStorage.getItem(MEDSENSE_PET_ENABLED_KEY);
	return stored === null ? true : stored === 'true';
};

export const setMedsensePetEnabled = (enabled: boolean): void => {
	window.localStorage.removeItem(MEDSENSE_PET_MODE_KEY);
	window.sessionStorage.removeItem(MEDSENSE_PET_SESSION_MODE_KEY);
	window.localStorage.setItem(MEDSENSE_PET_ENABLED_KEY, String(enabled));
	window.dispatchEvent(new CustomEvent(MEDSENSE_PET_ENABLED_EVENT, { detail: { enabled } }));
};
