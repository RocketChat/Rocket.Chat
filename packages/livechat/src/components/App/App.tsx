import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import { useLayoutEffect, useState } from 'preact/hooks';
import Router, { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import type { Department } from '../../definitions/departments';
import { setInitCookies } from '../../helpers/cookies';
import { isRTL } from '../../helpers/isRTL';
import { visibility } from '../../helpers/visibility';
import history from '../../history';
import Connection from '../../lib/connection';
import CustomFields from '../../lib/customFields';
import Hooks from '../../lib/hooks';
import { parentCall } from '../../lib/parentCall';
import Triggers from '../../lib/triggers';
import userPresence from '../../lib/userPresence';
import Chat from '../../routes/Chat';
import ChatFinished from '../../routes/ChatFinished';
import GDPRAgreement from '../../routes/GDPRAgreement';
import LeaveMessage from '../../routes/LeaveMessage';
import Register from '../../routes/Register';
import SwitchDepartment from '../../routes/SwitchDepartment';
import TriggerMessage from '../../routes/TriggerMessage';
import store, { type Dispatch, type StoreState } from '../../store';
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
	user?: {
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
	iframe: StoreState['iframe'];
};

export const App = ({ dispatch }: AppProps) => {
	const { t } = useTranslation();

	const [initialized, setInitialized] = useState(false);

	const handleRoute = async ({ url }: { url: string }) => {
		setTimeout(() => {
			// Read the current store state, not the render-closure props: route('/')
			// fires synchronously from the room store subscription before this
			// component re-renders, so the closure would still hold the pre-login
			// user and wrongly redirect a token-logged-in guest to /register.
			const { config, gdpr, user } = store.state;
			const {
				settings: {
					registrationForm,
					nameFieldRegistrationForm,
					emailFieldRegistrationForm,
					forceAcceptDataProcessingConsent: gdprRequired,
				},
				online,
				departments,
			} = config;
			const { accepted: gdprAccepted } = gdpr;

			setInitCookies();

			if (gdprRequired && !gdprAccepted) {
				route('/gdpr');
				return;
			}

			if (!online) {
				parentCall('callback', 'no-agent-online');
				route('/leave-message');
				return;
			}

			const showDepartment = departments.some((dept) => dept.showOnRegistration);
			const isAnyFieldVisible = nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment;
			const showRegistrationForm = !user?.token && registrationForm && isAnyFieldVisible && !Triggers.hasTriggersBeforeRegistration();

			if (url === '/' && showRegistrationForm) {
				route('/register');
			}
		}, 100);
	};

	// Emulates componentDidMount / componentWillUnmount. useLayoutEffect (not
	// useEffect) keeps the init/teardown synchronous with the commit, matching
	// the class lifecycle these behaviors were ported from.
	useLayoutEffect(() => {
		const handleVisibilityChange = async () => {
			dispatch({ visible: !visibility.hidden });
		};

		// Reads from the store at call time (after Connection.init has loaded the
		// config), not from the mount-render closure whose config is still the
		// initial empty state — otherwise Triggers.init() never runs.
		const handleTriggers = () => {
			const { config } = store.state;
			if (config.online && config.enabled) {
				Triggers.init();
			}

			void Triggers.processTriggers();
		};

		const initWidget = () => {
			const { config, minimized, iframe, undocked } = store.state;
			if (!undocked) {
				parentCall(minimized ? 'minimizeWindow' : 'restoreWindow');
				parentCall(iframe.visible ? 'showWidget' : 'hideWidget');
				parentCall('setWidgetPosition', config.theme.position || 'right');
			}

			visibility.addListener(handleVisibilityChange);

			void handleVisibilityChange();

			window.addEventListener('beforeunload', () => {
				visibility.removeListener(handleVisibilityChange);
				dispatch({ minimized: true, undocked: false });
			});
		};

		void (async () => {
			// TODO: split these behaviors into composable components
			await Connection.init();
			CustomFields.init();
			userPresence.init();
			Hooks.init();
			handleTriggers();
			initWidget();
			setInitialized(true);
			parentCall('ready');
		})();

		return () => {
			CustomFields.reset();
			userPresence.reset();
			visibility.removeListener(handleVisibilityChange);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Emulates componentDidUpdate: keep the document direction in sync with the
	// active language (react-i18next re-renders on languageChanged).
	useLayoutEffect(() => {
		if (t) {
			document.dir = isRTL(t('yes')) ? 'rtl' : 'ltr';
		}
	}, [t]);

	if (!initialized) {
		return null;
	}

	return (
		<ScreenProvider>
			<Router history={history} onChange={handleRoute}>
				<Chat path='/' default />
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

export default App;
