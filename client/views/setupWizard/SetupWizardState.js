import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { useRouteParameter, useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import { useUserId } from '../../contexts/UserContext';
import SetupWizardPage from './SetupWizardPage';

export const finalStep = 'final';

const useStepRouting = () => {
	const param = useRouteParameter('step');
	const userId = useUserId();
	const setupWizardRoute = useRoute('setup-wizard');

	const [currentStep, setCurrentStep] = useState(() => {
		if (param === finalStep) {
			return finalStep;
		}

		const step = parseInt(param, 10);
		if (Number.isFinite(step) && step >= 1) {
			return step;
		}

		return 1;
	});

	useEffect(() => {
		if (!userId) {
			setCurrentStep(1);
		} else if (currentStep === 1) {
			setCurrentStep(2);
		}

		setupWizardRoute.replace({ step: String(currentStep) });
	}, [setupWizardRoute, userId, currentStep]);

	return [currentStep, setCurrentStep];
};

const useParameters = () => {
	const [loaded, setLoaded] = useState(false);
	const [settings, setSettings] = useState([]);
	const [canDeclineServerRegistration, setCapableOfDeclineServerRegistration] = useState(false);
	const getSetupWizardParameters = useMethod('getSetupWizardParameters');

	useEffect(() => {
		let mounted = true;
		const requestParameters = async () => {
			try {
				const { settings = [], allowStandaloneServer = false } =
					(await getSetupWizardParameters()) || {};

				if (!mounted) {
					return;
				}

				setLoaded(true);
				setSettings(settings);
				setCapableOfDeclineServerRegistration(allowStandaloneServer);
			} catch (error) {
				setLoaded(false);
				setSettings([]);
				setCapableOfDeclineServerRegistration(false);
			}
		};

		requestParameters();

		return () => {
			mounted = false;
		};
	}, [getSetupWizardParameters]);

	return {
		loaded,
		settings,
		canDeclineServerRegistration,
	};
};

const SetupWizardContext = createContext({
	loaded: false,
	settings: [],
	canDeclineServerRegistration: false,
	goToPreviousStep: () => {},
	goToNextStep: () => {},
	goToFinalStep: () => {},
});

function SetupWizardState() {
	const [currentStep, setCurrentStep] = useStepRouting();
	const { loaded, settings, canDeclineServerRegistration } = useParameters();

	const goToPreviousStep = useCallback(
		() => setCurrentStep((currentStep) => currentStep - 1),
		[setCurrentStep],
	);
	const goToNextStep = useCallback(
		() => setCurrentStep((currentStep) => currentStep + 1),
		[setCurrentStep],
	);
	const goToFinalStep = useCallback(() => setCurrentStep(finalStep), [setCurrentStep]);

	const value = useMemo(
		() => ({
			currentStep,
			loaded,
			settings,
			canDeclineServerRegistration,
			goToPreviousStep,
			goToNextStep,
			goToFinalStep,
		}),
		[
			currentStep,
			loaded,
			settings,
			canDeclineServerRegistration,
			goToPreviousStep,
			goToNextStep,
			goToFinalStep,
		],
	);

	return (
		<SetupWizardContext.Provider value={value}>
			<SetupWizardPage currentStep={currentStep} />
		</SetupWizardContext.Provider>
	);
}

export const useSetupWizardContext = () => useContext(SetupWizardContext);

export default SetupWizardState;
