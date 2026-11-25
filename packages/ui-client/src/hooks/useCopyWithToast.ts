import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

/** Copies whatever text it is called with to the clipboard, and tells the user whether that worked. */
export const useCopyWithToast = (): ((text: string) => Promise<void>) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useStableCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			dispatchToastMessage({ type: 'success', message: t('Copied') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});
};
