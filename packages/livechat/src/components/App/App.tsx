import i18next from 'i18next';
import { Component } from 'preact';
import Router, { route } from 'preact-router';
import { parse } from 'query-string';
import { withTranslation } from 'react-i18next';

import { setInitCookies } from '../../helpers/cookies';
import { isActiveSession } from '../../helpers/isActiveSession';
import { isRTL } from '../../helpers/isRTL';
import { visibility } from '../../helpers/visibility';
import history from '../../history';
import Connection from '../../lib/connection';
import CustomFields from '../../lib/customFields';
import Hooks from '../../lib/hooks';
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
import type { Dispatch } from '../../store';
import store from '../../store';

type AppProps = {
	config: {
		settings: {
			registrationForm?: boolean;
			nameFieldRegistrationForm?: boolean;
			emailFieldRegistrationForm?: boolean;
			forceAcceptDataProcessingConsent?: boolean;
		};
		online?: boolean;
		departments: {
			showOnRegistration: boolean;
		}[];
		enabled?: boolean;
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
	};
	i18n: typeof i18next;
};

type AppState = {
	initialized: boolean;
	poppedOut: boolean;
};

// eslint-disable-next-line react/prefer-stateless-function
export class App extends Component<AppProps, AppState> {
	state = {
		initialized: false,
		poppedOut: false,
	};

	protected handleRoute = async () => {
		setTimeout(() => {
			const {
				config: {
					settings: {
						registrationForm,
						nameFieldRegistrationForm,
						emailFieldRegistrationForm,
						forceAcceptDataProcessingConsent: gdprRequired,
					},
					online,
					departments = [],
				},
				gdpr: { accepted: gdprAccepted },
				triggered,
				user,
			} = this.props;

			setInitCookies();

			if (gdprRequired && !gdprAccepted) {
				return route('/gdpr');
			}

			if (!online) {
				parentCall('callback', 'no-agent-online');
				return route('/leave-message');
			}

			const showDepartment = departments.filter((dept) => dept.showOnRegistration).length > 0;

			const showRegistrationForm =
				registrationForm && (nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment) && !triggered && !user?.token;
			if (showRegistrationForm) {
				return route('/register');
			}
		}, 100);
	};

	protected handleTriggers() {
		const {
			config: { online, enabled },
		} = this.props;
		if (online && enabled) {
			Triggers.init();
		}

		Triggers.processTriggers();
	}

	protected handleEnableNotifications = () => {
		const { dispatch, sound = {} } = this.props;
		dispatch({ sound: { ...sound, enabled: true } });
	};

	protected handleDisableNotifications = () => {
		const { dispatch, sound = {} } = this.props;
		dispatch({ sound: { ...sound, enabled: false } });
	};

	protected handleMinimize = () => {
		parentCall('minimizeWindow');
		const { dispatch } = this.props;
		dispatch({ minimized: true });
	};

	protected handleRestore = () => {
		parentCall('restoreWindow');
		const { dispatch, undocked } = this.props;
		const dispatchRestore = () => dispatch({ minimized: false, undocked: false });
		const dispatchEvent = () => {
			dispatchRestore();
			store.off('storageSynced', dispatchEvent);
		};
		if (undocked) {
			store.on('storageSynced', dispatchEvent);
		} else {
			dispatchRestore();
		}
		Triggers.callbacks?.emit('chat-opened-by-visitor');
	};

	protected handleOpenWindow = () => {
		parentCall('openPopout');
		const { dispatch } = this.props;
		dispatch({ undocked: true, minimized: false });
	};

	protected handleDismissAlert = (id: string) => {
		const { dispatch, alerts = [] } = this.props;
		dispatch({ alerts: alerts.filter((alert) => alert.id !== id) });
	};

	protected handleVisibilityChange = async () => {
		const { dispatch } = this.props;
		dispatch({ visible: !visibility.hidden });
	};

	protected handleLanguageChange = () => {
		this.forceUpdate();
	};

	protected dismissNotification = () => !isActiveSession();

	protected initWidget() {
		const {
			minimized,
			iframe: { visible },
			dispatch,
		} = this.props;
		parentCall(minimized ? 'minimizeWindow' : 'restoreWindow');
		parentCall(visible ? 'showWidget' : 'hideWidget');

		visibility.addListener(this.handleVisibilityChange);
		this.handleVisibilityChange();
		window.addEventListener('beforeunload', () => {
			visibility.removeListener(this.handleVisibilityChange);
			dispatch({ minimized: true, undocked: false });
		});

		i18next.on('languageChanged', this.handleLanguageChange);
	}

	protected checkPoppedOutWindow() {
		// Checking if the window is poppedOut and setting parent minimized if yes for the restore purpose
		const { dispatch } = this.props;
		const poppedOut = parse(window.location.search).mode === 'popout';
		this.setState({ poppedOut });
		if (poppedOut) {
			dispatch({ minimized: false });
		}
	}

	protected async initialize() {
		// TODO: split these behaviors into composable components
		await Connection.init();
		CustomFields.init();
		userPresence.init();
		Hooks.init();
		this.handleTriggers();
		this.initWidget();
		this.checkPoppedOutWindow();
		this.setState({ initialized: true });
		parentCall('ready');
	}

	protected async finalize() {
		CustomFields.reset();
		userPresence.reset();
		visibility.removeListener(this.handleVisibilityChange);
	}

	componentDidMount() {
		this.initialize();
	}

	componentWillUnmount() {
		this.finalize();
	}

	componentDidUpdate() {
		const { i18n } = this.props;

		if (i18n.t) {
			document.dir = isRTL(i18n.t('yes')) ? 'rtl' : 'ltr';
		}
	}

	render = ({ sound, undocked, minimized, expanded, alerts, modal, iframe }: AppProps, { initialized, poppedOut }: AppState) => {
		if (!initialized) {
			return null;
		}

		const { department, name, email } = iframe.guest || {};

		const screenProps = {
			notificationsEnabled: sound?.enabled,
			minimized: !poppedOut && (minimized || undocked),
			expanded: !minimized && expanded,
			windowed: !minimized && poppedOut,
			sound,
			alerts,
			modal,
			nameDefault: name,
			emailDefault: email,
			departmentDefault: department,
			onEnableNotifications: this.handleEnableNotifications,
			onDisableNotifications: this.handleDisableNotifications,
			onMinimize: this.handleMinimize,
			onRestore: this.handleRestore,
			onOpenWindow: this.handleOpenWindow,
			onDismissAlert: this.handleDismissAlert,
			dismissNotification: this.dismissNotification,
		};

		return (
			<Router history={history} onChange={this.handleRoute}>
				<ChatConnector default path='/' {...screenProps} />
				<ChatFinished path='/chat-finished' {...screenProps} />
				<GDPRAgreement path='/gdpr' {...screenProps} />
				<LeaveMessage path='/leave-message' {...screenProps} />
				<Register path='/register' {...screenProps} />
				<SwitchDepartment path='/switch-department' {...screenProps} />
				<TriggerMessage path='/trigger-messages' {...screenProps} />
			</Router>
		);
	};
}

export default withTranslation()(App);
