import { useQuery } from '@tanstack/react-query';
import type { FunctionalComponent } from 'preact';
import Router, { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useTranslation } from 'react-i18next';
import '../../i18next';

import { setInitCookies } from '../../helpers/cookies';
import { isRTL } from '../../helpers/isRTL';
import { visibility } from '../../helpers/visibility';
import history from '../../history';
import CustomFields from '../../lib/customFields';
import Hooks from '../../lib/hooks';
import { loadConfig } from '../../lib/main';
import { parentCall } from '../../lib/parentCall';
import Triggers from '../../lib/triggers';
import userPresence from '../../lib/userPresence';
import { ChatConnector } from '../../routes/Chat';
import ChatFinished from '../../routes/ChatFinished';
import GDPRAgreement from '../../routes/GDPRAgreement';
import LeaveMessage from '../../routes/LeaveMessage';
import Register from '../../routes/Register';
import SwitchDepartment from '../../routes/SwitchDepartment';
import TriggerMessage from '../../routes/TriggerMessage';
import { useStore } from '../../store';
import { ScreenProvider } from '../Screen/ScreenProvider';

export const App: FunctionalComponent = () => {
	const { t } = useTranslation();

	const {
		dispatch,
		minimized,
		iframe: { visible },
		config: {
			settings: { registrationForm, nameFieldRegistrationForm, emailFieldRegistrationForm, forceAcceptDataProcessingConsent: gdprRequired },
			online,
			departments,
			theme,
		},
		gdpr: { accepted: gdprAccepted },
		user,
	} = useStore();

	useEffect(() => {
		document.dir = isRTL(t('yes')) ? 'rtl' : 'ltr';
	}, [t]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			dispatch(() => ({
				visible: !visibility.hidden,
			}));
		};

		parentCall(minimized ? 'minimizeWindow' : 'restoreWindow');
		parentCall(visible ? 'showWidget' : 'hideWidget');
		parentCall('setWidgetPosition', theme.position || 'right');

		visibility.addListener(handleVisibilityChange);

		handleVisibilityChange();

		window.addEventListener('beforeunload', () => {
			visibility.removeListener(handleVisibilityChange);
			dispatch({ minimized: true, undocked: false });
		});
	}, [dispatch]);

	useEffect(() => {
		CustomFields.init();
		userPresence.init();
		Hooks.init();

		Triggers.init();

		Triggers.processTriggers();

		parentCall('ready');
		return () => {
			CustomFields.reset();
			userPresence.reset();
		};
	}, []);

	const handleRoute = async ({ url }: { url: string }) => {
		setTimeout(() => {
			setInitCookies();

			if (gdprRequired && !gdprAccepted) {
				return route('/gdpr');
			}

			if (!online) {
				parentCall('callback', 'no-agent-online');
				return route('/leave-message');
			}

			const showDepartment = departments.some((dept) => dept.showOnRegistration);
			const isAnyFieldVisible = nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment;
			const showRegistrationForm = !user?.token && registrationForm && isAnyFieldVisible && !Triggers.hasTriggersBeforeRegistration();

			if (url === '/' && showRegistrationForm) {
				return route('/register');
			}
		}, 100);
	};

	return (
		<ScreenProvider>
			<Router history={history} onChange={handleRoute}>
				<ChatConnector path='/' default />
				<ChatFinished path='/chat-finished' />
				<GDPRAgreement path='/gdpr' />
				<LeaveMessage path='/leave-message' />
				<Register path='/register' />
				<SwitchDepartment path='/switch-department' />
				<TriggerMessage path='/trigger-messages' />
			</Router>
		</ScreenProvider>
	);
};

const ConfigApp = () => {
	const config = useQuery(['config'], loadConfig);

	if (config.isLoading || config.isError) {
		return null;
	}

	return <App />;
};

export default ConfigApp;
