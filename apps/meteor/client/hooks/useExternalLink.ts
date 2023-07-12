import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';

export const useExternalLink = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	return (url: string | undefined) => {
		if (!url) {
			dispatchToastMessage({ message: 'Invalid url', type: 'error' });
			return;
		}
		window.open(url, '_blank', 'noopener noreferrer');
	};
};
