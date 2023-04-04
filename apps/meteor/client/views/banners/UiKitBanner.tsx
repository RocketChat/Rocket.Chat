import type { UIKitActionEvent, UiKitBannerProps } from '@rocket.chat/core-typings';
import { Banner, Icon } from '@rocket.chat/fuselage';
import { kitContext, bannerParser, UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import type { FC, ComponentProps, ReactElement, ContextType } from 'react';
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
			return <Icon name={state.icon as ComponentProps<typeof Icon>['name']} size={20} />;
		}

		return null;
	}, [state.icon]);

	const handleClose = useUIKitHandleClose(state, () => banners.close());

	const action = useUIKitHandleAction(state);

	const contextValue = useMemo<ContextType<typeof kitContext>>(
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
			<kitContext.Provider value={contextValue}>
				{renderUiKitBannerBlocks(state.blocks as LayoutBlock[], { engine: 'rocket.chat' })}
			</kitContext.Provider>
		</Banner>
	);
};

export default UiKitBanner;
