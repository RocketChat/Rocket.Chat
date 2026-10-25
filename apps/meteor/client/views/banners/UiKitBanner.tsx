import { Banner, Icon } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext, bannerParser, UiKitBanner as UiKitBannerSurfaceRender, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useMemo } from 'react';

import { useBannerContextValue } from './hooks/useBannerContextValue';
import MarkdownText from '../../components/MarkdownText';
import { useUiKitActionManager } from '../../hooks/uikit/useUiKitActionManager';
import { useUiKitView } from '../../hooks/uikit/useUiKitView';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }) => <MarkdownText variant='inline' content={text} />;

export type UiKitBannerProps = {
	key: UiKit.BannerView['viewId']; // force re-mount when viewId changes
	initialView: UiKit.BannerView;
};

const UiKitBanner = ({ initialView }: UiKitBannerProps) => {
	const { view, values, state } = useUiKitView(initialView);
	const actionManager = useUiKitActionManager();
	const contextValue = useBannerContextValue({ view, values });

	const icon = useMemo(() => {
		if (view.icon) {
			return <Icon name={view.icon} size='x20' />;
		}

		return null;
	}, [view.icon]);

	const dispatchToastMessage = useToastMessageDispatch();
	const handleClose = useStableCallback(() => {
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewClosed',
				payload: {
					viewId: view.viewId,
					view: {
						...view,
						id: view.viewId,
						state,
					},
					isCleared: true,
				},
			})
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
			});
	});

	// TODO: check why we are not considering TextObject as title
	if (view.title && typeof view.title !== 'string') {
		return null;
	}
	return (
		<Banner icon={icon} inline={view.inline} title={view.title} variant={view.variant} closeable onClose={handleClose}>
			<UiKitContext.Provider value={contextValue}>
				<UiKitComponent render={UiKitBannerSurfaceRender} blocks={view.blocks} />
			</UiKitContext.Provider>
		</Banner>
	);
};

export default UiKitBanner;
