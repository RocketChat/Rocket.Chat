import type { UseClipboardReturn } from '@rocket.chat/fuselage-hooks';
import { useClipboard, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';

export default function useClipboardWithToast(text: string): UseClipboardReturn {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useClipboard(text, {
		onCopySuccess: useMutableCallback(() => dispatchToastMessage({ type: 'success', message: t('Copied') })),
		onCopyError: useMutableCallback((e) => dispatchToastMessage({ type: 'error', message: e })),
	});
}
