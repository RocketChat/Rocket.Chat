import { useEffect, Suspense } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import DocumentTitleWrapper from './DocumentTitleWrapper';
import PageLoading from './PageLoading';
import { useEscapeKeyStroke } from './hooks/useEscapeKeyStroke';
import { useGoogleTagManager } from './hooks/useGoogleTagManager';
import { useMessageLinkClicks } from './hooks/useMessageLinkClicks';
import { useAnalytics } from '../../../app/analytics/client/loadScript';
import { useAnalyticsEventTracking } from '../../hooks/useAnalyticsEventTracking';
import { useLoadRoomForAllowedAnonymousRead } from '../../hooks/useLoadRoomForAllowedAnonymousRead';
import { useNotifyUser } from '../../hooks/useNotifyUser';
import { appLayout } from '../../lib/appLayout';
import { router } from '../../providers/RouterProvider';

const render = (name: string) =>
	appLayout.render(
		<div className={`outer - ${name}`}>
			<div className={`inner - ${name}`}>{name}</div>
			<div className={`inner - ${name}`}>{name}</div>
			<div className={`inner - ${name}`}>{name}</div>
			<div className={`inner - ${name}`}>{name}</div>
		</div>,
	);

const stressTest = async () => {
	for (let i = 0; i < 10000; i++) {
		await new Promise((r) => {
			render(i.toString());
			setTimeout(r, 10);
		});
	}
};

const stressNavigate = async () => {
	for (let i = 0; i < 10000; i++) {
		await new Promise((r) => {
			router.navigate(`/home/${i % 2 === 0 ? '1' : '2'}`);
			setTimeout(r, 10);
		});
	}
};
const AppLayout = () => {
	useEffect(() => {
		document.body.classList.add('color-primary-font-color', 'rcx-content--main');

		return () => {
			document.body.classList.remove('color-primary-font-color', 'rcx-content--main');
		};
	}, []);

	useMessageLinkClicks();
	useGoogleTagManager();
	useAnalytics();
	useEscapeKeyStroke();
	useAnalyticsEventTracking();
	useLoadRoomForAllowedAnonymousRead();
	useNotifyUser();

	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot);

	return (
		<Suspense fallback={<PageLoading />}>
			<div>
				<button onClick={() => render('test 1')}>Render 1</button>
				<button onClick={() => render('test 2')}>Render 2</button>
				<button onClick={() => stressTest()}>Stress render</button>
				<a href='/home/1'>Render 1</a>
				<a href='/home/2'>Render 2</a>
				<button onClick={() => stressNavigate()}>Stress navigate</button>
			</div>
			<DocumentTitleWrapper>{layout}</DocumentTitleWrapper>
		</Suspense>
	);
};

export default AppLayout;
