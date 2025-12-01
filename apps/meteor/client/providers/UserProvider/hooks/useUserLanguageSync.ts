import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

type UseUserLanguageSyncParams = { language?: string } | null;

export const useUserLanguageSync = (user: UseUserLanguageSyncParams): void => {
	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const [userLanguage, setUserLanguage] = useLocalStorage('userLanguage', '');
	const [preferedLanguage, setPreferedLanguage] = useLocalStorage('preferedLanguage', '');
	const [isLanguageSyncPending, setLanguageSyncPending] = useLocalStorage('userLanguagePendingSync', false);
	const pendingLanguageRef = useRef<string | null>(null);
	const serverLanguage = user?.language;

	useEffect(() => {
		if (!serverLanguage) {
			return;
		}

		const hasPreferedLanguage = typeof preferedLanguage === 'string' && preferedLanguage.length > 0;

		if (isLanguageSyncPending) {
			if (serverLanguage !== undefined && serverLanguage === preferedLanguage) {
				setLanguageSyncPending(false);
				pendingLanguageRef.current = null;
				return;
			}

			if (hasPreferedLanguage && serverLanguage !== preferedLanguage) {
				if (pendingLanguageRef.current !== preferedLanguage) {
					pendingLanguageRef.current = preferedLanguage;
					void setUserPreferences({ data: { language: preferedLanguage } }).catch(() => {
						setLanguageSyncPending(false);
						pendingLanguageRef.current = null;
					});
				}
				if (userLanguage !== preferedLanguage) {
					setUserLanguage(preferedLanguage);
				}
				return;
			}
		} else if (pendingLanguageRef.current) {
			pendingLanguageRef.current = null;
		}

		if (serverLanguage !== undefined && userLanguage !== serverLanguage) {
			setUserLanguage(serverLanguage);
		}

		if (serverLanguage !== undefined && preferedLanguage !== serverLanguage) {
			setPreferedLanguage(serverLanguage);
		}
	}, [
		isLanguageSyncPending,
		preferedLanguage,
		serverLanguage,
		setLanguageSyncPending,
		setPreferedLanguage,
		setUserLanguage,
		setUserPreferences,
		userLanguage,
	]);
};
