import React, { useState } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import GenericModal from '../../../components/GenericModal';
import TeamAutocomplete from '../TeamAutocomplete';


const StepOne = ({
	teamId = '',
	onChange,
	onClose,
	onCancel,
	onConfirm,
}) => {
	const t = useTranslation();

	return <GenericModal
		variant='warning'
		cancelText={t('Cancel')}
		confirmText={t('Continue')}
		title={t('Teams_Select_a_team')}
		onClose={onClose}
		onCancel={onCancel}
		onConfirm={onConfirm}
	>
		<Box withRichContent>
			{t('Teams_move_channel_to_team_description')}
		</Box>

		<Box display='flex' width='100%'><TeamAutocomplete onChange={onChange} value={teamId}/></Box>
	</GenericModal>;
};

const StepTwo = ({
	onClose,
	onCancel,
	onConfirm,
}) => {
	const t = useTranslation();

	return <GenericModal
		variant='warning'
		icon='warning'
		title={t('Confirmation')}
		confirmText='Yes'
		onClose={onClose}
		onCancel={onCancel}
		onConfirm={onConfirm}
	>
		<Box>{t('Teams_move_channel_to_team_confirm_description')}</Box>
	</GenericModal>;
};

const ChannelToTeamModal = ({
	onClose,
	onConfirm,
}) => {
	const [step, setStep] = useState(1);
	const [teamId, setTeamId] = useState();

	const nextStep = () => setStep(step + 1);

	if (step === 2) {
		return <StepTwo
			onClose={onClose}
			onCancel={onClose}
			onConfirm={() => onConfirm(teamId)}
		/>;
	}

	return <StepOne
		onClose={onClose}
		onCancel={onClose}
		onConfirm={nextStep}
		onChange={setTeamId}
		teamId={teamId}
	/>;
};

export default ChannelToTeamModal;
