import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type UseFormSubmitOptions = {
	isDirty: boolean;
	noChangesMessage?: string;
};

/**
 * A reusable hook for form submission that implements accessible form validation patterns.
 *
 * This hook wraps your form submission handler and:
 * - Allows submission attempts in both create and edit modes (keeping buttons enabled for a11y)
 * - Provides user-friendly feedback when trying to save an unchanged edit form
 */

export const useFormSubmitWithDirtyCheck = <TData>(
	onSubmit: (data: TData) => Promise<void> | void,
	{ isDirty, noChangesMessage = 'No_changes_to_save' }: UseFormSubmitOptions,
) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(
		async (data: TData): Promise<void> => {
			if (!!data && !isDirty) {
				dispatchToastMessage({
					type: 'info',
					message: t(noChangesMessage),
				});
				return;
			}

			await onSubmit(data);
		},
		[isDirty, onSubmit, dispatchToastMessage, t, noChangesMessage],
	);
};
