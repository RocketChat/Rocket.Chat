import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { TAPi18n } from 'meteor/tap:i18n';
import { Tracker } from 'meteor/tracker';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { settings } from '../../../app/settings';
import { hasRole } from '../../../app/authorization';
import { Users } from '../../../app/models';
import { handleError } from '../../../app/utils';
import { call } from '../../../app/ui-utils';

const steps = [
	{
		number: 1,
		id: 'admin-info',
		title: 'Admin_Info',
		i18nTitleKey: 'Admin_Info',
	},
	{
		number: 2,
		id: 'organization-info',
		title: 'Organization_Info',
		i18nTitleKey: 'Organization_Info',
	},
	{
		number: 3,
		id: 'server-info',
		title: 'Server_Info',
		i18nTitleKey: 'Server_Info',
	},
	{
		number: 4,
		id: 'register-server',
		title: 'Register_Server',
		i18nTitleKey: 'Register_Server',
	},
];

const toTitleCase = ([firstLetter, ...letters]) => `${ firstLetter.toUpperCase() }${ letters.join('') }`;

const cannotSetup = () => {
	const showSetupWizard = settings.get('Show_Setup_Wizard');
	if (!showSetupWizard) {
		// Setup Wizard state is not defined yet
		return;
	}

	const userId = Meteor.userId();
	const user = userId && Users.findOne(userId, { fields: { status: true } });
	if (userId && (!user || !user.status)) {
		// User and its status are not defined yet
		return;
	}

	const isComplete = showSetupWizard === 'completed';
	const noUserLoggedInAndIsNotPending = !userId && showSetupWizard !== 'pending';
	const userIsLoggedButIsNotAdmin = userId && !hasRole(userId, 'admin');

	return isComplete || noUserLoggedInAndIsNotPending || userIsLoggedButIsNotAdmin;
};

const persistSettings = (state, callback) => {
	const setupSettings = Object.entries(state)
		.filter(([key]) => !/registration-|registerServer|optIn|currentStep|invalidUsername|invalidEmail/.test(key))
		.map(([_id, value]) => ({ _id, value }))
		.concat([
			{
				_id: 'Statistics_reporting',
				value: state.registerServer,
			},
			{
				_id: 'Apps_Framework_enabled',
				value: state.registerServer,
			},
			{
				_id: 'Register_Server',
				value: state.registerServer,
			},
			{
				_id: 'Allow_Marketing_Emails',
				value: state.optIn,
			},
		]);

	settings.batchSet(setupSettings, (error) => {
		if (error) {
			return handleError(error);
		}

		callback && callback();
	});
};

const SetupWizardContext = createContext();

export const useSetupWizardState = () => useContext(SetupWizardContext);

export function SetupWizardState({ children }) {
	const [state, _setState] = useState({
		currentStep: 1,
		registerServer: true,
		optIn: true,
	});

	const setState = (...args) => {
		if (typeof args[0] === 'object') {
			_setState({ ...state, ...args[0] });
			return;
		}

		if (typeof args[0] === 'string') {
			_setState({ ...state, [args[0]]: args[1] });
		}
	};

	const [wizardSettings, setWizardSettings] = useState([]);

	const [allowStandaloneServer, setAllowStandaloneServer] = useState(false);

	const formState = useMemo(() => [
		...['name', 'username', 'email', 'pass']
			.map((key) => [key, {
				id: key,
				value: state[`registration-${ key }`],
				invalid: state[`invalid${ toTitleCase(key) }`],
				setValue: (newValue) => setState(`registration-${ key }`, newValue),
			}]),
		...wizardSettings
			.sort(({ wizard: { order: a } }, { wizard: { order: b } }) => a - b)
			.map(({ _id, type, i18nLabel, values, wizard }) => [_id, {
				step: steps[wizard.step - 1],
				id: _id,
				type,
				label: i18nLabel,
				value: state[_id],
				options: (
					type === 'select'
				&& values
				&& values.map(({ i18nLabel, key }) => ({ label: i18nLabel, value: key }))
				)
				|| (
					type === 'language'
				&& Object.entries(TAPi18n.getLanguages())
					.map(([key, { name }]) => ({ label: name, value: key }))
					.sort((a, b) => a.key - b.key)
				),
				setValue: (newValue) => setState(_id, newValue),
			}]),
		['optIn', {
			id: 'optIn',
			value: state.optIn,
			setValue: (newValue) => setState('optIn', newValue),
		}],
		['registerServer', {
			id: 'registerServer',
			value: state.registerServer,
			setValue: (newValue) => setState('registerServer', newValue),
		}],
	].reduce((state, [key, value]) => ({ ...state, [key]: value }), {}),
	[wizardSettings, state, setState]);

	useEffect(() => {
		const initialPageLoadingElement = document.getElementById('initial-page-loading');
		if (initialPageLoadingElement) {
			initialPageLoadingElement.remove();
		}
	}, []);

	const handleContinueClick = () => {
		switch (state.currentStep) {
			case 2: {
				setState('currentStep', 3);
				return;
			}
			case 3: {
				setState('currentStep', 4);
				return;
			}
			case 4: {
				persistSettings(state, () => {
					localStorage.removeItem('wizard');
					localStorage.setItem('wizardFinal', true);

					if (state.registerServer) {
						Meteor.call('cloud:registerWorkspace', (error) => {
							if (error) {
								console.warn(error);
								return;
							}

							FlowRouter.go('setup-wizard-final');
						});
					} else {
						FlowRouter.go('setup-wizard-final');
					}
				});
			}
		}
	};

	const handleBackClick = () => {
		setState('currentStep', state.currentStep - 1);
	};

	useEffect(() => {
		if (localStorage.getItem('wizardFinal')) {
			return FlowRouter.go('setup-wizard-final');
		}

		const jsonString = localStorage.getItem('wizard');
		const persistedState = (jsonString && JSON.parse(jsonString)) || {
			currentStep: 1,
			registerServer: true,
			optIn: true,
		};
		setState(persistedState);
	}, []);

	useEffect(() => {
		const persistedState = { ...state, 'registration-pass': '' };
		localStorage.setItem('wizard', JSON.stringify(persistedState));
	}, [state]);

	useEffect(() => {
		const computation = Tracker.autorun(async (c) => {
			const cantSetup = cannotSetup();

			if (typeof cantSetup === 'undefined') {
				return;
			}

			if (cantSetup) {
				c.stop();
				FlowRouter.go('home');
				return;
			}

			if (!Meteor.userId()) {
				return setState('currentStep', 1);
			}

			if (state.currentStep === 1) {
				setState('currentStep', 2);
			} else {
				setState('registration-pass', '');
			}
		});

		return () => {
			computation.stop();
		};
	}, [state]);

	useEffect(() => {
		const computation = Tracker.autorun(async (c) => {
			if (!Meteor.userId()) {
				return;
			}

			const { settings, allowStandaloneServer } = await call('getSetupWizardParameters') || {};
			setWizardSettings(settings);
			setAllowStandaloneServer(allowStandaloneServer);

			c.stop();
		});

		return () => {
			computation.stop();
		};
	}, []);

	return <SetupWizardContext.Provider value={{
		currentStepNumber: state.currentStep,
		currentStep: steps[state.currentStep - 1],
		steps,
		goToPreviousStep: () => setState('currentStep', state.currentStep - 1),
		goToNextStep: () => setState('currentStep', state.currentStep + 1),
		formState,
		allowStandaloneServer,
		handleContinueClick,
		handleBackClick,
	}}>
		{children}
	</SetupWizardContext.Provider>;
}
