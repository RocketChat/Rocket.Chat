import { UiKitContext, bannerParser, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import type { ReactElement } from 'react';
import React from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import { useBannerContextValue } from '../../../../uikit/hooks/useBannerContextValue';
import { useUiKitView } from '../../../../uikit/hooks/useUiKitView';
import type { SubscriptionLicenseLayout } from './UiKitSubscriptionLicenseSurface';
import { UiKitSubscriptionLicenseSurface } from './UiKitSubscriptionLicenseSurface';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }): ReactElement => <MarkdownText variant='inline' content={text} />;

type UiKitSubscriptionLicenseProps = {
	key: string;
	initialView: {
		viewId: string;
		appId: string;
		blocks: SubscriptionLicenseLayout;
	};
};

const UiKitSubscriptionLicense = ({ initialView }: UiKitSubscriptionLicenseProps) => {
	const { view, values } = useUiKitView(initialView);
	const contextValue = useBannerContextValue({ view, values });

	return (
		<UiKitContext.Provider value={contextValue}>
			<UiKitComponent render={UiKitSubscriptionLicenseSurface} blocks={view.blocks} />
		</UiKitContext.Provider>
	);
};

export default UiKitSubscriptionLicense;
