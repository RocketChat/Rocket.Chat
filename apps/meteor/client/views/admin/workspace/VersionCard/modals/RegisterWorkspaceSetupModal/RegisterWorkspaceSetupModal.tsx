import { useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

import { validateEmail } from '../../../../../../../lib/emailValidator';
import RegisteredWorkspaceModal from '../RegisteredWorkspaceModal';
import RegisterWorkspaceSetupStepOneModal from './RegisterWorkspaceSetupStepOneModal';
import RegisterWorkspaceSetupStepTwoModal from './RegisterWorkspaceSetupStepTwoModal';

type RegisterWorkspaceSetupModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const RegisterWorkspaceSetupModal = ({ onClose }: RegisterWorkspaceSetupModalProps) => {
	const setModal = useSetModal();

	const [step, setStep] = useState(1);
	const [email, setEmail] = useState('');
	const [terms, setTerms] = useState(false);
	const [validInfo, setValidInfo] = useState(false);
	const [intentData, setIntentData] = useState({
		device_code: '',
		interval: 0,
		user_code: '',
	});

	// reset validInfo when users go back to step 1
	useEffect(() => {
		setValidInfo(false);
	}, [step]);

	useEffect(() => {
		if (step === 1) {
			setValidInfo(validateEmail(email) && terms);
		}
	}, [email, terms]);

	const onSuccess = () => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisteredWorkspaceModal onClose={handleModalClose} />);
	};

	return (
		<>
			{step === 1 ? (
				<RegisterWorkspaceSetupStepOneModal
					email={email}
					setEmail={setEmail}
					step={step}
					setStep={setStep}
					terms={terms}
					setTerms={setTerms}
					onClose={onClose}
					validInfo={validInfo}
					setIntentData={setIntentData}
				/>
			) : (
				<RegisterWorkspaceSetupStepTwoModal
					email={email}
					step={step}
					setStep={setStep}
					onClose={onClose}
					intentData={intentData}
					onSuccess={onSuccess}
				/>
			)}
		</>
	);
};

export default RegisterWorkspaceSetupModal;
