import AsyncRoute from 'preact-async-route';
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
			handleVisibilityChange(dispatch);
			window.addEventListener('beforeunload', () => {
				visibility.removeListener(fn);
				dispatch({ minimized: true, undocked: false });
			});
		};

		const checkPoppedOutWindow = () => {
			// Checking if the window is poppedOut and setting parent minimized if yes for the restore purpose
			const poppedOut = parse(window.location.search).mode === 'popout';

			setState((prevState) => ({ ...prevState, poppedOut }));

			if (poppedOut) {
				dispatch({ minimized: false });
			}
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

	const ChatConnectorComponent = () => import('../../routes/Chat').then((module) => module.default);
	const ChatFinishedComponent = () => import('../../routes/ChatFinished').then((module) => module.default);
	const GDPRAgreementComponent = () => import('../../routes/GDPRAgreement').then((module) => module.default);
	const LeaveMessageComponent = () => import('../../routes/LeaveMessage').then((module) => module.default);
	const RegisterComponent = () => import('../../routes/Register').then((module) => module.default);
	const SwitchDepartmentComponent = () => import('../../routes/SwitchDepartment').then((module) => module.default);
	const TriggerMessageComponent = () => import('../../routes/TriggerMessage').then((module) => module.default);

	return (
		<Router history={history} onChange={() => handleRoute({ config, gdpr, triggered, user })}>
			<AsyncRoute default path='/' getComponent={ChatConnectorComponent} {...screenProps} />
			<AsyncRoute path='/chat-finished' getComponent={ChatFinishedComponent} {...screenProps} />
			<AsyncRoute path='/gdpr' getComponent={GDPRAgreementComponent} {...screenProps} />
			<AsyncRoute path='/leave-message' getComponent={LeaveMessageComponent} {...screenProps} />
			<AsyncRoute path='/register' getComponent={RegisterComponent} {...screenProps} />
			<AsyncRoute path='/switch-department' getComponent={SwitchDepartmentComponent} {...screenProps} />
			<AsyncRoute path='/trigger-messages' getComponent={TriggerMessageComponent} {...screenProps} />
		</Router>
	);
};

export default App;
