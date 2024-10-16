import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import i18next from 'i18next';
import { Component } from 'preact';
import Router, { route } from 'preact-router';
import { withTranslation } from 'react-i18next';

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
import { ChatConnector } from '../../routes/Chat';
import ChatFinished from '../../routes/ChatFinished';
import GDPRAgreement from '../../routes/GDPRAgreement';
import LeaveMessage from '../../routes/LeaveMessage';
import Register from '../../routes/Register';
import SwitchDepartment from '../../routes/SwitchDepartment';
import TriggerMessage from '../../routes/TriggerMessage';
import type { Dispatch, StoreState } from '../../store';
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

type AppState = {
	initialized: boolean;
	poppedOut: boolean;
};

export class App extends Component<AppProps, AppState> {
	state = {
		initialized: false,
		poppedOut: false,
	};

	protected handleRoute = async ({ url }: { url: string }) => {
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
					departments,
				},
				gdpr: { accepted: gdprAccepted },
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

			const showDepartment = departments.some((dept) => dept.showOnRegistration);
			const isAnyFieldVisible = nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment;
			const showRegistrationForm = !user?.token && registrationForm && isAnyFieldVisible && !Triggers.hasTriggersBeforeRegistration();

			if (url === '/' && showRegistrationForm) {
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

	protected handleVisibilityChange = async () => {
		const { dispatch } = this.props;
		dispatch({ visible: !visibility.hidden });
	};

	protected handleLanguageChange = () => {
		this.forceUpdate();
	};

	protected initWidget() {
		const {
			minimized,
			iframe: { visible },
			config: { theme },
			dispatch,
		} = this.props;

		parentCall(minimized ? 'minimizeWindow' : 'restoreWindow');
		parentCall(visible ? 'showWidget' : 'hideWidget');
		parentCall('setWidgetPosition', theme.position || 'right');

		visibility.addListener(this.handleVisibilityChange);

		this.handleVisibilityChange();

		window.addEventListener('beforeunload', () => {
			visibility.removeListener(this.handleVisibilityChange);
			dispatch({ minimized: true, undocked: false });
		});

		i18next.on('languageChanged', this.handleLanguageChange);
	}

	protected async initialize() {
		// TODO: split these behaviors into composable components
		await Connection.init();
		CustomFields.init();
		userPresence.init();
		Hooks.init();
		this.handleTriggers();
		this.initWidget();
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

	render = (_: AppProps, { initialized }: AppState) => {
		if (!initialized) {
			return null;
		}

		return (
			<ScreenProvider>
				<Router history={history} onChange={this.handleRoute}>
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
}

export default withTranslation()(App);
