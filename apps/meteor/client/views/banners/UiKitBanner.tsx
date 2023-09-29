import type { UiKit } from '@rocket.chat/core-typings';
import { Banner, Icon } from '@rocket.chat/fuselage';
import { UiKitContext, bannerParser, UiKitBanner as UiKitBannerSurfaceRender, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import type { ReactElement, ContextType } from 'react';
import React, { useMemo } from 'react';

import { useUiKitView } from '../../UIKit/hooks/useUiKitView';
import MarkdownText from '../../components/MarkdownText';
import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';
import * as banners from '../../lib/banners';
import { useUIKitHandleClose } from './hooks/useUIKitHandleClose';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }): ReactElement => <MarkdownText variant='inline' content={text} />;

type UiKitBannerProps = {
	key: UiKit.BannerView['viewId']; // force re-mount when viewId changes
	initialView: UiKit.BannerView;
};

const UiKitBanner = ({ initialView }: UiKitBannerProps) => {
	const { view } = useUiKitView(initialView);

	const icon = useMemo(() => {
		if (view.icon) {
			return <Icon name={view.icon} size='x20' />;
		}

		return null;
	}, [view.icon]);

	const handleClose = useUIKitHandleClose(view, () => banners.close());

	const actionManager = useUiKitActionManager();

	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: async ({ appId, viewId, actionId }): Promise<void> => {
				if (!appId || !viewId) {
					return;
				}

				await actionManager.triggerBlockAction({
					container: {
						type: 'view',
						id: viewId,
					},
					actionId,
					appId,
				});
				banners.closeById(view.viewId);
			},
			state: (): void => undefined,
			appId: view.appId,
			values: {},
		}),
		[actionManager, view.appId, view.viewId],
	);

	return (
		<Banner icon={icon} inline={view.inline} title={view.title} variant={view.variant} closeable onClose={handleClose}>
			<UiKitContext.Provider value={contextValue}>
				<UiKitComponent render={UiKitBannerSurfaceRender} blocks={view.blocks} />
			</UiKitContext.Provider>
		</Banner>
	);
};

export default UiKitBanner;
