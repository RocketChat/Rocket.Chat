import type { UiKit } from '@rocket.chat/core-typings';
import { Banner, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext, bannerParser, UiKitBanner as UiKitBannerSurfaceRender, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement, ContextType } from 'react';
import React, { useMemo } from 'react';

import { useUiKitActionManager } from '../../UIKit/hooks/useUiKitActionManager';
import { useUiKitView } from '../../UIKit/hooks/useUiKitView';
import MarkdownText from '../../components/MarkdownText';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }): ReactElement => <MarkdownText variant='inline' content={text} />;

type UiKitBannerProps = {
	key: UiKit.BannerView['viewId']; // force re-mount when viewId changes
	initialView: UiKit.BannerView;
};

const UiKitBanner = ({ initialView }: UiKitBannerProps) => {
	const { view, values, state } = useUiKitView(initialView);

	const icon = useMemo(() => {
		if (view.icon) {
			return <Icon name={view.icon} size='x20' />;
		}

		return null;
	}, [view.icon]);

	const dispatchToastMessage = useToastMessageDispatch();
	const handleClose = useMutableCallback(() => {
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
				return Promise.reject(error);
			})
			.finally(() => {
				actionManager.disposeView(view.viewId);
			});
	});

	const actionManager = useUiKitActionManager();

	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: async ({ appId, viewId, actionId, blockId, value }) => {
				if (!appId || !viewId) {
					return;
				}

				await actionManager.emitInteraction(appId, {
					type: 'blockAction',
					actionId,
					container: {
						type: 'view',
						id: viewId,
					},
					payload: {
						blockId,
						value,
					},
				});

				actionManager.disposeView(view.viewId);
			},
			state: (): void => undefined,
			appId: view.appId,
			values: values as any,
		}),
		[view, values, actionManager],
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
