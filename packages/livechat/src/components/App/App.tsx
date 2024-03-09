import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import type i18next from 'i18next';
import type { FunctionalComponent } from 'preact';
import Router, { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useTranslation, withTranslation } from 'react-i18next';
import '../../i18next';

import type { Department } from '../../definitions/departments';
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
import type { Dispatch, StoreState } from '../../store';
import { useStore } from '../../store';
import { ScreenProvider } from '../Screen/ScreenProvider';

type AppProps = {
	config: {
		settings: StoreState['config']['settings'];
		theme: StoreState['config']['theme'];
		online?: boolean;
		departments: Department[];
		enabled?: boolean;
		triggers: ILivechatTrigger[];
	};
	gdpr: {
		accepted: boolean;
	};
	triggered?: boolean;
	user: {
		token: string;
	};
	dispatch: Dispatch;
	sound: {
		enabled: boolean;
	};
	minimized: boolean;
	undocked?: boolean;
	expanded: boolean;
	modal: boolean;
	alerts: {
		id: string;
	}[];
	iframe: {
		visible: boolean;
		guest?: {
			token: string;
			department: string;
			name: string;
			email: string;
		};
		theme: StoreState['iframe']['theme'];
	};
	i18n: typeof i18next;
};

export const App: FunctionalComponent<AppProps> = ({
	config: {
		settings: { registrationForm, nameFieldRegistrationForm, emailFieldRegistrationForm, forceAcceptDataProcessingConsent: gdprRequired },
		online,
		departments,
	},
	gdpr: { accepted: gdprAccepted },
	user,
}) => {
	const { t } = useTranslation();

	const {
		dispatch,
		minimized,
		iframe: { visible },
		config: { theme },
	} = useStore();

	useEffect(() => {
		document.dir = isRTL(t('yes')) ? 'rtl' : 'ltr';
	}, [t]);

	useEffect(() => {
		loadConfig();

		// const {
		// 	config: { online, enabled },
		// } = useStore();

		// if (online && enabled) {
		// 	Triggers.init();
		// }

		Triggers.processTriggers();

		const handleVisibilityChange = () => {
			dispatch(({ visible }) => ({
				visible: !visible,
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

export default withTranslation()(App);
