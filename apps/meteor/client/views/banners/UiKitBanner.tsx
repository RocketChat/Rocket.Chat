import type { UiKitBannerProps } from '@rocket.chat/core-typings';
import { Banner, Icon } from '@rocket.chat/fuselage';
import { UiKitContext, bannerParser, UiKitBanner as UiKitBannerSurfaceRender, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import type { FC, ReactElement } from 'react';
import React, { useMemo } from 'react';

import { useBannerContextValue } from '../../UiKit/hooks/useBannerContextValue';
import { useUIKitHandleClose } from '../../UiKit/hooks/useUIKitHandleClose';
import MarkdownText from '../../components/MarkdownText';
import * as banners from '../../lib/banners';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }): ReactElement => <MarkdownText variant='inline' content={text} />;

const UiKitBanner: FC<UiKitBannerProps> = ({ payload }) => {
	const contextValue = useBannerContextValue(payload);

	const { state } = contextValue;

	const icon = useMemo(() => {
		if (state.icon) {
			return <Icon name={state.icon as IconName} size={20} />;
		}

		return null;
	}, [state.icon]);

	const handleClose = useUIKitHandleClose(state, () => banners.close());

	return (
		<Banner closeable icon={icon} inline={state.inline} title={state.title} variant={state.variant} onClose={handleClose}>
			<UiKitContext.Provider value={contextValue}>
				<UiKitComponent render={UiKitBannerSurfaceRender} blocks={state.blocks as LayoutBlock[]} />
			</UiKitContext.Provider>
		</Banner>
	);
};

export default UiKitBanner;
