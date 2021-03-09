import React, { FC, useState } from 'react';
import { Box, Margins } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import GenericModal from '../../../components/GenericModal';
import ChannelSelectionTable from './ChannelSelectionTable';

type RemoveUsersModalParams = {
	onClose: () => void;
	results: Array<string>;
	currentStep: number;
}

type RemoveUsersStepsParams = {
	onClose: () => void;
	username: string;
	results: Array<string>;
	onCancel?: () => void;
	onConfirm: () => void;
}

const RemoveUsersFirstStep: FC<RemoveUsersStepsParams> = ({
	onClose,
	onCancel,
	onConfirm,
	username,
	results,
	...props
}) => {
	const t = useTranslation();

	return <GenericModal
		variant='warning'
		icon='warning'
		title={t('What would you like to do?')}
		onClose={onClose}
		onCancel={onCancel}
		onConfirm={onConfirm}
		{...props}><>
			<Box mbe='x24' fontScale='p1'>{t('Select the Channels you want the user to be removed from')}</Box>
			<ChannelSelectionTable results={results} username={username} />
		</>
	</GenericModal>;
};

const RemoveUsersSecondStep: FC<RemoveUsersStepsParams> = ({
	onClose,
	onCancel,
	username,
	...props
}) => {
	const t = useTranslation();

	return <GenericModal
		variant='danger'
		cancelText='Back'
		confirmText='Remove'
		icon='info'
		title={t('Not Removed from')}
		onClose={onClose}
		onCancel={onCancel}
		{...props}>
		<Margins blockEnd='x16'>
			<Box>{ username } is the last owner of some Channels, once removed from the Team, the Channel will be kept inside the Team but the member will still be responsible for managing the Channel from outside the Team.</Box>
			<Box>{ username } is not going to be removed from the following Channels: #dev, #marketing.</Box>
			<Box>You did not select the following Channels so Gustavo Septimus will be kept on them: #common-cases.</Box>
		</Margins>
	</GenericModal>;
};

const RemoveUsersModal: FC<RemoveUsersModalParams> = ({
	onClose,
	results,
	currentStep = 1,
}) => {
	const [step, setStep] = useState(currentStep);
	const username = 'Gustavo Septimus';

	if (step === 2) {
		return <RemoveUsersSecondStep
			onConfirm={(): void => alert('test')}
			onClose={onClose}
			onCancel={(): void => setStep(1)}
			username={username}
			results={[]}
		/>;
	}

	return <RemoveUsersFirstStep
		username={username}
		results={results}
		onClose={onClose}
		onCancel={(): void => alert('Cancel')}
		onConfirm={(): void => setStep(2)}
	/>;
};

export default RemoveUsersModal;
