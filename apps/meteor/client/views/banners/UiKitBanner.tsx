import type { UIKitActionEvent, UiKitBannerProps } from '@rocket.chat/core-typings';
import { Banner, Icon } from '@rocket.chat/fuselage';
import { UiKitContext, bannerParser, UiKitBanner as UiKitBannerSurfaceRender, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import type { FC, ReactElement, ContextType } from 'react';
import React, { useMemo } from 'react';

import { useUIKitHandleAction } from '../../UIKit/hooks/useUIKitHandleAction';
import { useUIKitHandleClose } from '../../UIKit/hooks/useUIKitHandleClose';
import { useUIKitStateManager } from '../../UIKit/hooks/useUIKitStateManager';
import MarkdownText from '../../components/MarkdownText';
import * as banners from '../../lib/banners';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }): ReactElement => <MarkdownText variant='inline' content={text} />;

const UiKitBanner: FC<UiKitBannerProps> = ({ payload }) => {
	const state = useUIKitStateManager(payload);

	const icon = useMemo(() => {
		if (state.icon) {
			return <Icon name={state.icon as IconName} size='x20' />;
		}

		return null;
	}, [state.icon]);

	const handleClose = useUIKitHandleClose(state, () => banners.close());

	const action = useUIKitHandleAction(state);

	const contextValue = useMemo<ContextType<typeof UiKitContext>>(
		() => ({
			action: async (event): Promise<void> => {
				if (!event.viewId) {
					return;
				}
				await action(event as UIKitActionEvent);
				banners.closeById(state.viewId);
			},
			state: (): void => undefined,
			appId: state.appId,
			values: {},
		}),
		[action, state.appId, state.viewId],
	);

	return (
		<Banner closeable icon={icon} inline={state.inline} title={state.title} variant={state.variant} onClose={handleClose}>
			<UiKitContext.Provider value={contextValue}>
				<UiKitComponent render={UiKitBannerSurfaceRender} blocks={state.blocks as LayoutBlock[]} />
			</UiKitContext.Provider>
		</Banner>
	);
};

export default UiKitBanner;
