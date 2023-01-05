import { Throbber, Box } from '@rocket.chat/fuselage';
import { useLayout, useRouteParameter, useQueryStringParameter, useAbsoluteUrl, useLanguage } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import type { UpgradeTabVariant } from '../../../../../lib/upgradeTab';
import Page from '../../../../components/Page';
import PageHeader from '../../../../components/Page/PageHeader';
import UpgradePageError from '../UpgradePageError';

const urlMap: Record<UpgradeTabVariant, string> = {
	'go-fully-featured': 'https://go.rocket.chat/i/upgrade-ce-1-unregistered',
	'go-fully-featured-registered': 'https://go.rocket.chat/i/upgrade-ce-1-registered',
	'trial-enterprise': 'https://go.rocket.chat/i/upgrade-ee-trial',
	'upgrade-your-plan': 'https://go.rocket.chat/i/upgrade-ce-2',
};

const getUrl = (type: UpgradeTabVariant, date: string | undefined, language: string): string => {
	const urlParams = new URLSearchParams({ lang: language.toLowerCase() });
	if (date) {
		urlParams.set('date', date);
	}

	return `${urlMap[type]}?${urlParams.toString()}`;
};

type NavigationMessage = { goTo: string };

const isNavigationMessage = (message: unknown): message is NavigationMessage => {
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

	if (isNavigationMessage(parsedMessage)) {
		return parsedMessage.goTo;
	}
};

const UpgradePage = (): ReactElement => {
	const [isLoading, setIsLoading] = useState(true);

	const type = useRouteParameter('type') as UpgradeTabVariant;
	const trialEndDate = useQueryStringParameter('trialEndDate');
	const language = useLanguage();
	const pageUrl = getUrl(type, trialEndDate, language);

	const getAbsoluteUrl = useAbsoluteUrl();

	const { isMobile } = useLayout();

	const ref = useRef<HTMLIFrameElement>(null);
	const hasConnection = navigator.onLine;

	useEffect(() => {
		const handleNavigationMessage = (e: MessageEvent<string>): void => {
			if (ref?.current?.contentWindow !== e.source) {
				return;
			}

			const path = getWindowMessagePath(e);

			if (!path) {
				return;
			}

			window.location.href = getAbsoluteUrl(path);
		};

		window.addEventListener('message', handleNavigationMessage);

		return (): void => {
			window.removeEventListener('message', handleNavigationMessage);
		};
	}, [getAbsoluteUrl]);

	return (
		<Page data-qa='admin-upgrade'>
			{isMobile && <PageHeader title='' />}
			{!hasConnection && <UpgradePageError />}
			{hasConnection && isLoading && (
				<Box width='100%' height='100%' position='absolute' display='flex' justifyContent='center' alignItems='center'>
					<Throbber />
				</Box>
			)}
			{hasConnection && (
				<Box
					is='iframe'
					src={pageUrl}
					ref={ref}
					onLoad={(): void => setIsLoading(false)}
					invisible={isLoading}
					width='100%'
					height='100%'
				/>
			)}
		</Page>
	);
};

export default UpgradePage;
