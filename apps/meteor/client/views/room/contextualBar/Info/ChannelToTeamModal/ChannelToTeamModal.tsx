import type { IRoom } from '@rocket.chat/core-typings';
import { useState } from 'react';

import ChannelToTeamConfirmation from './ChannelToTeamConfirmation';
import ChannelToTeamSelection from './ChannelToTeamSelection';

type ChannelToTeamModalProps = {
	onCancel: () => void;
	onConfirm: (teamId: IRoom['_id']) => void;
};

const CHANNEL_TO_TEAM_STEPS = {
	SELECTION: 'selection',
	CONFIRMATION: 'confirmation',
};

const ChannelToTeamModal = ({ onCancel, onConfirm }: ChannelToTeamModalProps) => {
	const [step, setStep] = useState(CHANNEL_TO_TEAM_STEPS.SELECTION);
	const [teamId, setTeamId] = useState<string>();

	if (step === CHANNEL_TO_TEAM_STEPS.CONFIRMATION && teamId) {
		return <ChannelToTeamConfirmation onCancel={onCancel} onConfirm={() => onConfirm(teamId)} />;
	}

	const handleChange = (value: string | string[]) => {
		if (typeof value === 'string') {
			setTeamId(value);
		}
	};

	return (
		<ChannelToTeamSelection
			onCancel={onCancel}
			onConfirm={() => setStep(CHANNEL_TO_TEAM_STEPS.CONFIRMATION)}
			onChange={handleChange}
			teamId={teamId}
		/>
	);
};

export default ChannelToTeamModal;
