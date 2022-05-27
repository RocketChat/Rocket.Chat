import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useState, useCallback, useRef, useMemo } from 'react';

import { AccountPreferencesFormContext, AccountPreferencesFormContextValue } from '../contexts/AccountPreferencesFormContext';

type UserPreferences = { highlights?: string; dontAskAgainList?: string[] };

export const AccountPreferencesFormProvider: FC = ({ children }) => {
	const t = useTranslation();
	const saveData = useRef<UserPreferences>({});
	const commitRef = useRef<Record<string, any>>({});
	const [hasAnyChange, setHasAnyChange] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();

	const onChange = useCallback(
		({ initialValue, value, key }) => {
			const { current } = saveData;

			if (JSON.stringify(initialValue) !== JSON.stringify(value)) {
				current[key as keyof UserPreferences] = value;
			} else {
				delete current[key as keyof UserPreferences];
			}

			const anyChange = !!Object.values(current).length;
			if (anyChange !== hasAnyChange) {
				setHasAnyChange(anyChange);
			}
		},
		[hasAnyChange],
	);

	const saveFn = useMethod('saveUserPreferences');

	const handleSave = useCallback(async () => {
		try {
			const { current: data } = saveData;
			if (data.highlights || data.highlights === '') {
				Object.assign(data, {
					highlights: data.highlights
						.split(/,|\n/)
						.map((val) => val.trim())
						.filter(Boolean),
				});
			}

			if (data.dontAskAgainList) {
				const list =
					Array.isArray(data.dontAskAgainList) && data.dontAskAgainList.length > 0
						? data.dontAskAgainList.map(([action, label]) => ({ action, label }))
						: [];
				Object.assign(data, { dontAskAgainList: list });
			}

			await saveFn(data as UserPreferences);
			saveData.current = {};
			setHasAnyChange(false);
			Object.values(commitRef.current).forEach((fn) => fn());

			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	}, [dispatchToastMessage, saveFn, t]);

	const context: AccountPreferencesFormContextValue = useMemo(
		() => ({
			onChange,
			handleSave,
			commitRef,
			hasAnyChange,
		}),
		[onChange, handleSave, commitRef, hasAnyChange],
	);

	return <AccountPreferencesFormContext.Provider value={context} children={children} />;
};
