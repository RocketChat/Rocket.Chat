import React, { useEffect, useState } from 'react';
import { validateEmail } from '../../../../../lib/emailValidator';
import RegisterWorkspaceSetupStepOneModal from './RegisterWorkspaceSetupStepOneModal';
import RegisterWorkspaceSetupStepTwoModal from './RegisterWorkspaceSetupStepTwoModal';

type RegisterWorkspaceSetupModalProps = {
  onClose: () => void,
}

const RegisterWorkspaceSetupModal = ({ onClose }: RegisterWorkspaceSetupModalProps) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [terms, setTerms] = useState(false);
  const [validInfo, setValidInfo] = useState(false);

  // reset validInfo when users go back to step 1
  useEffect(() => {
    setValidInfo(false);
  }, [step]);

  useEffect(() => {
    if (step === 1) {
      setValidInfo(validateEmail(email) && terms);
    }
  }, [email, terms]);

  return (
    <>
      { step === 1 ? (
          <RegisterWorkspaceSetupStepOneModal
            email={email}
            setEmail={setEmail}
            step={step}
            setStep={setStep}
            terms={terms}
            setTerms={setTerms}
            onClose={onClose}
            validInfo={validInfo}
          />
        ) : (
          <RegisterWorkspaceSetupStepTwoModal
            email={email}
            step={step}
            setStep={setStep}
            onClose={onClose}
          />
        )
      }
    </>
  )
}

export default RegisterWorkspaceSetupModal;
