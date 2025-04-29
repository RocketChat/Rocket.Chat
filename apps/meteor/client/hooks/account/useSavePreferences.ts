import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getDirtyFields } from '../../lib/getDirtyFields';
import { dispatchToastMessage } from '../../lib/toast';
import type { AccountPreferencesData } from '../../views/account/preferences/useAccountPreferencesValues';

type useSavePreferencesProps = {
	dirtyFields: Partial<Record<keyof AccountPreferencesData, boolean | boolean[]>>;
};

export const useSavePreferences = ({ dirtyFields }: useSavePreferencesProps) => {
	const setPreferencesEndpoint = useEndpoint('POST', '/v1/users.setPreferences');
	const { t } = useTranslation();

	const setPreferencesAction = useMutation({
		mutationFn: ({
			data,
		}: {
			data: AccountPreferencesData & { dontAskAgainList?: { action: string; label: string }[] } & { highlights?: string[] };
		}) => setPreferencesEndpoint({ data }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	return async (formData: AccountPreferencesData) => {
		const { highlights, dontAskAgainList, ...data } = getDirtyFields(formData, dirtyFields);
		if (highlights || highlights === '') {
			Object.assign(data, {
				highlights:
					typeof highlights === 'string' &&
					highlights
						.split(/,|\n/)
						.map((val) => val.trim())
						.filter(Boolean),
			});
		}

		if (dontAskAgainList) {
			const list =
				Array.isArray(dontAskAgainList) && dontAskAgainList.length > 0
					? dontAskAgainList.map(([action, label]) => ({ action, label }))
					: [];
			Object.assign(data, { dontAskAgainList: list });
		}
		setPreferencesAction.mutateAsync({ data });
	};
};
