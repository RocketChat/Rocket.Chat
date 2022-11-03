import { iframeLogin } from '../../../../app/ui-utils/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

const pollIframeLoginUrl = (): string | undefined => {
	if (!iframeLogin.reactiveEnabled.get()) {
		return undefined;
	}

	return iframeLogin.reactiveIframeUrl.get();
};

export const useIframeLogin = (): string | undefined => useReactiveValue(pollIframeLoginUrl);
