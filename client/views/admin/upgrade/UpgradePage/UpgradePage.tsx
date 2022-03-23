import { Throbber, Box } from '@rocket.chat/fuselage';
import React, { ReactElement, useEffect, useRef, useState } from 'react';

import type { UpgradeTabVariants } from '../../../../../lib/getUpgradeTabType';
import Page from '../../../../components/Page';
import { useRouteParameter } from '../../../../contexts/RouterContext';
import { useAbsoluteUrl } from '../../../../contexts/ServerContext';
import UpgradePageError from '../UpgradePageError';

const iframeStyle = { width: '100%', height: '100%' };

const getUrl = (type: UpgradeTabVariants): string => {
	switch (type) {
		case 'goFullyFeatured':
			return 'https://rocket.chat/product-projects/upgrade-tab-ce-1-unregistered';
		case 'goFullyFeaturedRegistered':
			return 'https://rocket.chat/product-projects/upgrade-tab-ce-1-registered';
		case 'trialGold':
			return 'https://rocket.chat/product-projects/upgrade-tab-gold-trial';
		case 'trialEnterprise':
			return 'https://rocket.chat/product-projects/upgrade-tab-ee-trial';
		case 'upgradeYourPlan':
			return 'https://rocket.chat/product-projects/upgrade-tab-ce-2';
	}
};

type NavigationMessage = { goTo: string };

const messageIsNavigation = (message: unknown): message is NavigationMessage => {
	if (typeof message === 'object' && message !== null) {
		return 'goTo' in message;
	}

	return false;
};

const getWindowMessagePath = (e: MessageEvent<string>): string | undefined => {
	let parsedMessage = {};

	try {
		parsedMessage = JSON.parse(e.data);
	} catch (error) {
		return;
	}

	if (messageIsNavigation(parsedMessage)) {
		return parsedMessage.goTo;
	}
};

const UpgradePage = (): ReactElement => {
	const type = useRouteParameter('type') as UpgradeTabVariants;
	const getAbsoluteUrl = useAbsoluteUrl();
	const [isLoading, setIsLoading] = useState(true);
	const pageUrl = getUrl(type);
	const ref = useRef<HTMLIFrameElement>(null);
	const hasConnection = navigator.onLine;

	useEffect(() => {
		const navigate = (e: MessageEvent<string>): void => {
			if (ref?.current?.contentWindow !== e.source) {
				return;
			}

			const path = getWindowMessagePath(e);

			if (!path) {
				return;
			}

			window.location.href = getAbsoluteUrl(path);
		};

		window.addEventListener('message', navigate);

		return (): void => {
			window.removeEventListener('message', navigate);
		};
	}, [getAbsoluteUrl]);

	return (
		<Page data-qa='admin-upgrade'>
			{!hasConnection && <UpgradePageError />}
			{hasConnection && isLoading && (
				<Box pb='x24'>
					<Throbber />
				</Box>
			)}
			{hasConnection && <iframe src={pageUrl} style={iframeStyle} ref={ref} onLoad={(): void => setIsLoading(false)} />}
		</Page>
	);
};

export default UpgradePage;
