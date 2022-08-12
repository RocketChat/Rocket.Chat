import { Router } from 'preact-router';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { parse } from 'query-string';
import { useTranslation } from 'react-i18next';

import history from '../../history';
import Connection from '../../lib/connection';
import CustomFields from '../../lib/customFields';
import Hooks from '../../lib/hooks';
import { isRTL } from '../../lib/isRTL';
import { parentCall } from '../../lib/parentCall';
import userPresence from '../../lib/userPresence';
import { ChatConnector } from '../../routes/Chat';
import ChatFinished from '../../routes/ChatFinished';
import GDPRAgreement from '../../routes/GDPRAgreement';
import LeaveMessage from '../../routes/LeaveMessage';
import Register from '../../routes/Register';
import SwitchDepartment from '../../routes/SwitchDepartment';
import TriggerMessage from '../../routes/TriggerMessage';
import { visibility, isActiveSession } from '../helpers';
import { handleDisableNotifications, handleDismissAlert, handleEnableNotifications, handleMinimize, handleOpenWindow, handleRestore, handleRoute, handleTriggers, handleVisibilityChange } from './handlers';


export const App = ({
	config,
	gdpr,
	triggered,
	user,
	sound,
	undocked,
	minimized,
	expanded,
	alerts,
	modal,
	dispatch,
	iframe,
}) => {
	const { t } = useTranslation();
	const [state, setState] = useState(() => ({ initialized: false, poppedOut: false }));

	const dismissNotification = useCallback(() => !isActiveSession(), []);

	const fn = useMemo(() => handleVisibilityChange(dispatch), [dispatch]);

	const checkPoppedOutWindow = () => {
		// Checking if the window is poppedOut and setting parent minimized if yes for the restore purpose
		const { dispatch } = this.props;
		const poppedOut = parse(window.location.search).mode === 'popout';

		setState((prevState) => ({ ...prevState, poppedOut }));

		if (poppedOut) {
			dispatch({ minimized: false });
		}
	};

	const screenProps = {
		notificationsEnabled: sound && sound.enabled,
		minimized: !state.poppedOut && (minimized || undocked),
		expanded: !minimized && expanded,
		windowed: !minimized && state.poppedOut,
		sound,
		alerts,
		modal,
		onEnableNotifications: () => handleEnableNotifications({ dispatch, sound }),
		onDisableNotifications: () => handleDisableNotifications({ dispatch, sound }),
		onMinimize: () => handleMinimize(dispatch),
		onRestore: () => handleRestore({ dispatch, undocked }),
		onOpenWindow: () => handleOpenWindow(dispatch),
		onDismissAlert: (id) => handleDismissAlert(dispatch, alerts, id),
		dismissNotification,
	};

	useEffect(() => {
		const initWidget = () => {
			parentCall(minimized ? 'minimizeWindow' : 'restoreWindow');
			parentCall(iframe.visible ? 'showWidget' : 'hideWidget');

			visibility.addListener(fn);
			this.handleVisibilityChange();
			window.addEventListener('beforeunload', () => {
				visibility.removeListener(fn);
				dispatch({ minimized: true, undocked: false });
			});
		};

		const initialize = async () => {
			// TODO: split these behaviors into composable components
			await Connection.init();
			CustomFields.init();
			userPresence.init();
			Hooks.init();
			handleTriggers(config);
			initWidget();
			checkPoppedOutWindow();
			setState((prevState) => ({ ...prevState, initialized: true }));
			parentCall('ready');
		};

		const finalize = async () => {
			CustomFields.reset();
			userPresence.reset();
			visibility.removeListener(fn);
		};

		initialize();
		return () => {
			finalize();
		};
	}, [config, dispatch, fn, iframe.visible, minimized]);

	useEffect(() => {
		document.dir = isRTL(t('yes')) ? 'rtl' : 'ltr';
	}, [t]);

	if (!state.initialized) {
		return null;
	}

	return (
		<Router history={history} onChange={() => handleRoute({ config, gdpr, triggered, user })}>
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

export default App;
