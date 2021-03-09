import React, { FC, useState } from 'react';
import { Box, Margins, Select } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import GenericModal from '../../../components/GenericModal';

type RemoveUsersModalParams = {
	onClose: () => void;
	channels: [string, string][];
	currentStep: number;
}

type RemoveUsersStepsParams = {
	onClose: () => void;
	onCancel?: () => void;
	onConfirm: () => void;
	channels?: [string, string][];
}

const RemoveUsersFirstStep: FC<RemoveUsersStepsParams> = ({
	onClose,
	onCancel,
	onConfirm,
	channels,
	...props
}) => {
	const t = useTranslation();

	return <GenericModal
		variant='warning'
		cancelText='Cancel'
		confirmText='Contiue'
		title={t('Select a Team')}
		onClose={onClose}
		onCancel={onCancel}
		onConfirm={onConfirm}
		{...props}>
		<Margins blockEnd='x16'>
			<Box>Moving a Channel inside a Team means that this Channel will be added in the Team’s context, however, all Channel’s members, which are not members of the respective Team, will still have access to this Channel, but will not be added as Team’s members.</Box>
			<Box>All Channel’s management will still be made by the owners of this Channel.</Box>
			<Box>Team’s members and even Team’s owners, if not a member of this Channel, can not have access to the Channel’s content.</Box>
			<Box>Please notice that the Team’s owner will be able remove members from the Channel. </Box>
		</Margins>

		{channels && <Box display='flex' width='100%'><Select options={channels} /></Box>}
	</GenericModal>;
};

const RemoveUsersSecondStep: FC<RemoveUsersStepsParams> = ({
	onClose,
	onCancel,
	onConfirm,
	...props
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
		{...props}><>
			<Box>{t('After reading the previous intructions about this behavior, do you want to move forward with this action?')}</Box>
		</>
	</GenericModal>;
};

const ChannelToTeamModal: FC<RemoveUsersModalParams> = ({
	onClose,
	channels,
	currentStep = 1,
}) => {
	const [step, setStep] = useState(currentStep);

	if (step === 2) {
		return <RemoveUsersSecondStep
			onConfirm={(): void => alert('test')}
			onClose={onClose}
			onCancel={(): void => setStep(1)}
			channels={[]}
		/>;
	}

	return <RemoveUsersFirstStep
		onClose={onClose}
		onCancel={(): void => alert('Cancel')}
		onConfirm={(): void => setStep(2)}
		channels={channels}
	/>;
};

export default ChannelToTeamModal;
