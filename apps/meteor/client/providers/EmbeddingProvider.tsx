import { EmbeddingContext, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

const hiddenActionsDefaultValue = {
	roomToolbox: [],
	messageToolbox: [],
	composerToolbox: [],
	userToolbox: [],
};

export type EmbeddingProviderProps = {
	children?: ReactNode;
};

const EmbeddingProvider = ({ children }: EmbeddingProviderProps) => {
	const showTopNavbarEmbeddedLayout = useSetting('UI_Show_top_navbar_embedded_layout', false);
	const [hiddenActions, setHiddenActions] = useState(hiddenActionsDefaultValue);

	const router = useRouter();
	// Once the layout is embedded, it can't be changed
	const [isEmbedded] = useState(() => router.getSearchParameters().layout === 'embedded');

	useEffect(() => {
		const eventHandler = (event: MessageEvent<any>) => {
			if (event.data?.event !== 'overrideUi') {
				return;
			}

			setHiddenActions({ ...hiddenActionsDefaultValue, ...event.data.hideActions });
		};
		window.addEventListener('message', eventHandler);
		return () => window.removeEventListener('message', eventHandler);
	}, []);

	return (
		<EmbeddingContext.Provider
			value={useMemo(
				() => ({ isEmbedded, showTopNavbarEmbeddedLayout, hiddenActions }),
				[isEmbedded, showTopNavbarEmbeddedLayout, hiddenActions],
			)}
		>
			{children}
		</EmbeddingContext.Provider>
	);
};

export default EmbeddingProvider;
