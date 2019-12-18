import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { useIsMounted } from '../../hooks/useIsMounted';
import { useMethod } from '../../hooks/useMethod';
import { useUserId } from '../../hooks/useUserId';
import { useRouteParameter, useRoute } from '../../contexts/RouterContext';
import { SetupWizardPage } from './SetupWizardPage';

export const finalStep = 'final';

const useStepRouting = () => {
	const param = useRouteParameter('step');
	const userId = useUserId();
	const goToSetupWizard = useRoute('setup-wizard');

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

		goToSetupWizard.replacingState({ step: String(currentStep) });
	}, [goToSetupWizard, userId, currentStep]);

	return [currentStep, setCurrentStep];
};

const useParameters = () => {
	const [loaded, setLoaded] = useState(false);
	const [settings, setSettings] = useState([]);
	const [canDeclineServerRegistration, setCapableOfDeclineServerRegistration] = useState(false);
	const getSetupWizardParameters = useMethod('getSetupWizardParameters');
	const isMounted = useIsMounted();

	useEffect(() => {
		const requestParameters = async () => {
			try {
				const {
					settings,
					allowStandaloneServer,
				} = await getSetupWizardParameters() || {};

				if (!isMounted()) {
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
	}, [isMounted]);

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

export function SetupWizardState() {
	const [currentStep, setCurrentStep] = useStepRouting();
	const {
		loaded,
		settings,
		canDeclineServerRegistration,
	} = useParameters();

	const goToPreviousStep = useCallback(() => setCurrentStep((currentStep) => currentStep - 1), []);
	const goToNextStep = useCallback(() => setCurrentStep((currentStep) => currentStep + 1), []);
	const goToFinalStep = useCallback(() => setCurrentStep(finalStep), []);

	const value = useMemo(() => ({
		loaded,
		settings,
		canDeclineServerRegistration,
		goToPreviousStep,
		goToNextStep,
		goToFinalStep,
	}), [
		loaded,
		settings,
		canDeclineServerRegistration,
	]);

	return <SetupWizardContext.Provider value={value}>
		<SetupWizardPage currentStep={currentStep} />
	</SetupWizardContext.Provider>;
}

export const useSetupWizardContext = () => useContext(SetupWizardContext);
