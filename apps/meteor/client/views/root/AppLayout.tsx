import { useEffect, Suspense, useSyncExternalStore } from 'react';

import DocumentTitleWrapper from './DocumentTitleWrapper';
import PageLoading from './PageLoading';
import { useAppleOAuth } from './hooks/customOAuth/useAppleOAuth';
import { useCustomOAuth } from './hooks/customOAuth/useCustomOAuth';
import { useDolphinOAuth } from './hooks/customOAuth/useDolphinOAuth';
import { useDrupalOAuth } from './hooks/customOAuth/useDrupalOAuth';
import { useGitHubEnterpriseOAuth } from './hooks/customOAuth/useGitHubEnterpriseOAuth';
import { useGitLabOAuth } from './hooks/customOAuth/useGitLabOAuth';
import { useNextcloudOAuth } from './hooks/customOAuth/useNextcloudOAuth';
import { useWordPressOAuth } from './hooks/customOAuth/useWordPressOAuth';
import { useAnalytics } from './hooks/useAnalytics';
import { useAnalyticsEventTracking } from './hooks/useAnalyticsEventTracking';
import { useAutoupdate } from './hooks/useAutoupdate';
import { useCodeHighlight } from './hooks/useCodeHighlight';
import { useCorsSSLConfig } from './hooks/useCorsSSLConfig';
import { useDesktopFavicon } from './hooks/useDesktopFavicon';
import { useDesktopTitle } from './hooks/useDesktopTitle';
import { useEmojiOne } from './hooks/useEmojiOne';
import { useEscapeKeyStroke } from './hooks/useEscapeKeyStroke';
import { useGoogleTagManager } from './hooks/useGoogleTagManager';
import { useIframeCommands } from './hooks/useIframeCommands';
import { useIframeLoginListener } from './hooks/useIframeLoginListener';
import { useLivechatEnterprise } from './hooks/useLivechatEnterprise';
import { useLoadMissedMessages } from './hooks/useLoadMissedMessages';
import { useLoadRoomForAllowedAnonymousRead } from './hooks/useLoadRoomForAllowedAnonymousRead';
import { useLoginViaQuery } from './hooks/useLoginViaQuery';
import { useMessageLinkClicks } from './hooks/useMessageLinkClicks';
import { useNotificationPermission } from './hooks/useNotificationPermission';
import { useRedirectToSetupWizard } from './hooks/useRedirectToSetupWizard';
import { useSettingsOnLoadSiteUrl } from './hooks/useSettingsOnLoadSiteUrl';
import { useStartupEvent } from './hooks/useStartupEvent';
import { appLayout } from '../../lib/appLayout';

const AppLayout = () => {
	useEffect(() => {
		document.body.classList.add('color-primary-font-color', 'rcx-content--main');

		return () => {
			document.body.classList.remove('color-primary-font-color', 'rcx-content--main');
		};
	}, []);

	useIframeLoginListener();
	useMessageLinkClicks();
	useGoogleTagManager();
	useAnalytics();
	useEscapeKeyStroke();
	useAnalyticsEventTracking();
	useLoadRoomForAllowedAnonymousRead();
	useNotificationPermission();
	useEmojiOne();
	useRedirectToSetupWizard();
	useSettingsOnLoadSiteUrl();
	useLivechatEnterprise();
	useNextcloudOAuth();
	useGitLabOAuth();
	useGitHubEnterpriseOAuth();
	useDrupalOAuth();
	useDolphinOAuth();
	useAppleOAuth();
	useWordPressOAuth();
	useCustomOAuth();
	useCorsSSLConfig();
	useAutoupdate();
	useCodeHighlight();
	useLoginViaQuery();
	useLoadMissedMessages();
	useDesktopFavicon();
	useDesktopTitle();
	useStartupEvent();
	useIframeCommands();

	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot);

	return (
		<Suspense fallback={<PageLoading />}>
			<DocumentTitleWrapper>{layout}</DocumentTitleWrapper>
		</Suspense>
	);
};

export default AppLayout;
