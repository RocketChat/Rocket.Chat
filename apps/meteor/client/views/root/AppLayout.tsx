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
import { useTokenpassOAuth } from './hooks/customOAuth/useTokenpassOAuth';
import { useWordPressOAuth } from './hooks/customOAuth/useWordPressOAuth';
import { useCodeHighlight } from './hooks/useCodeHighlight';
import { useEscapeKeyStroke } from './hooks/useEscapeKeyStroke';
import { useGoogleTagManager } from './hooks/useGoogleTagManager';
import { useLoadMissedMessages } from './hooks/useLoadMissedMessages';
import { useLoginViaQuery } from './hooks/useLoginViaQuery';
import { useMessageLinkClicks } from './hooks/useMessageLinkClicks';
import { useSettingsOnLoadSiteUrl } from './hooks/useSettingsOnLoadSiteUrl';
import { useCorsSSLConfig } from '../../../app/cors/client/useCorsSSLConfig';
import { useEmojiOne } from '../../../app/emoji-emojione/client/hooks/useEmojiOne';
import { useLivechatEnterprise } from '../../../app/livechat-enterprise/hooks/useLivechatEnterprise';
import { useIframeLoginListener } from '../../hooks/iframe/useIframeLoginListener';
import { useNotificationPermission } from '../../hooks/notification/useNotificationPermission';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAnalyticsEventTracking } from '../../hooks/useAnalyticsEventTracking';
import { useAutoupdate } from '../../hooks/useAutoupdate';
import { useLoadRoomForAllowedAnonymousRead } from '../../hooks/useLoadRoomForAllowedAnonymousRead';
import { appLayout } from '../../lib/appLayout';
// import { useRedirectToSetupWizard } from '../../startup/useRedirectToSetupWizard';

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
	// useRedirectToSetupWizard();
	useSettingsOnLoadSiteUrl();
	useLivechatEnterprise();
	useNextcloudOAuth();
	useGitLabOAuth();
	useGitHubEnterpriseOAuth();
	useDrupalOAuth();
	useDolphinOAuth();
	useTokenpassOAuth();
	useAppleOAuth();
	useWordPressOAuth();
	useCustomOAuth();
	useCorsSSLConfig();
	useAutoupdate();
	useCodeHighlight();
	useLoginViaQuery();
	useLoadMissedMessages();

	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot);

	return (
		<Suspense fallback={<PageLoading />}>
			<DocumentTitleWrapper>{layout}</DocumentTitleWrapper>
		</Suspense>
	);
};

export default AppLayout;
