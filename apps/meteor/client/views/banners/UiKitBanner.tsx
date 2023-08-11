import type { UiKitBannerPayload } from '@rocket.chat/core-typings';
import { Banner, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext, bannerParser, UiKitBanner as UiKitBannerSurfaceRender, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { useBannerContextValue } from '../../UIKit/hooks/useBannerContextValue';
import MarkdownText from '../../components/MarkdownText';
import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';
import * as banners from '../../lib/banners';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }): ReactElement => <MarkdownText variant='inline' content={text} />;

type UiKitBannerProps = {
	initialPayload: UiKitBannerPayload;
};

const UiKitBanner = ({ initialPayload }: UiKitBannerProps) => {
	const actionManager = useUiKitActionManager();
	const dispatchToastMessage = useToastMessageDispatch();
	const contextValue = useBannerContextValue(initialPayload);

	const { payload } = contextValue;

	const icon = useMemo<ReactElement | null>(() => {
		if (payload.icon) {
			return <Icon name={payload.icon as IconName} size='x20' />;
		}

		return null;
	}, [payload.icon]);

	const handleClose = useMutableCallback(() =>
		actionManager
			.triggerCancel({
				appId: payload.appId,
				viewId: payload.viewId,
				view: {
					...payload,
					id: payload.viewId,
				},
				isCleared: true,
			})
			.then(() => () => banners.close())
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
				() => banners.close();
				return Promise.reject(error);
			}),
	);

	return (
		<Banner closeable icon={icon} inline={payload.inline} title={payload.title} variant={payload.variant} onClose={handleClose}>
			<UiKitContext.Provider value={contextValue}>
				<UiKitComponent render={UiKitBannerSurfaceRender} blocks={payload.blocks as LayoutBlock[]} />
			</UiKitContext.Provider>
		</Banner>
	);
};

export default UiKitBanner;
