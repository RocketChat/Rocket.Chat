import React, { FC, useMemo, useState, useCallback } from 'react';
import { Button, ButtonGroup, Box, Modal, Icon, Table, Margins, CheckBox } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';

import { useTranslation } from '../../../contexts/TranslationContext';
import GenericTable from '../../../components/GenericTable';

type RemoveUsersModalParams = {
	onClose: () => void;
	results: Array<string>;
	currentStep: number;
}

type RemoveUsersGenericModalParams = {
	onClose: () => void;
	onBack?: () => void;
	onConfirm?: () => void;
	backwardsLabel?: string;
	forwardsLabel?: string;
	buttonVariant?: string;
	icon: string;
	iconColor?: string;
	title: string;
	children?: React.ReactElement;
}

type ChannelSelectionTableParams = {
	username: string;
	results: Array<string>;
}

type ChannelRowParams = {
	icon?: string;
	name?: string;
	time: string;
	warning: (username: string) => string;
}

const ChannelSelectionTable: FC<ChannelSelectionTableParams> = ({ username, results }) => {
	const [params, setParams] = useState({ limit: 25, skip: 0 });
	const t = useTranslation();

	const handleChange = (): void => {
		console.log('t e');
	};

	const handleParams = useMutableCallback(({ current, itemsPerPage }) => {
		setParams({ skip: current, limit: itemsPerPage });
	});

	const header = useMemo(() => [
		<GenericTable.HeaderCell key='name' sort='name'>
			<CheckBox checked={false} disabled={false} />
			<Box mi='x8'>{t('Channel Name')}</Box>
		</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key='action' sort='action'>
			<Box width='100%' textAlign='end'>{t('Joined At')}</Box>
		</GenericTable.HeaderCell>,
	], [t]);

	const ChannelRow: FC<ChannelRowParams> = ({ icon, name, time, warning }) => <Table.Row action>
		<Table.Cell maxWidth='x300' withTruncatedText >
			<CheckBox checked={false} onChange={handleChange} disabled={false} />
			<Margins inline='x8'>
				<Icon size='x16' name={icon} color={colors.n700} />
				{name}
				{warning && <Icon title={warning(username)} size='x16' name='info' color={colors.r600} />}
			</Margins>
		</Table.Cell>

		<Table.Cell align='end' withTruncatedText>
			{time}
		</Table.Cell>
	</Table.Row>;

	return <>
		<Box mbe='x24' fontScale='p1'>Select the Channels you want the user to be removed from.</Box>
		<Box display='flex' flexDirection='column' height='30vh'>
			<GenericTable
				header={header}
				total={10}
				results={results}
				params={params}
				setParams={handleParams}
				fixed={false}
				pagination={false}
			>
				{useCallback((resultData: any): any => <ChannelRow icon={resultData.icon} name={resultData.name} time={resultData.time} warning={resultData.warning} />, [])}
			</GenericTable>
		</Box>
	</>;
};

const RemoveUsersModalGeneric: FC<RemoveUsersGenericModalParams> = ({
	onClose,
	onBack,
	onConfirm,
	backwardsLabel = 'Cancel',
	forwardsLabel = 'Continue',
	buttonVariant = 'primary',
	icon,
	iconColor = colors.y700,
	title,
	children,
	...props
}) => (
	<Modal {...props}>
		<Modal.Header>
			<Icon name={icon} size='x24' color={iconColor} />
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content>
			{children}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onBack}>{backwardsLabel}</Button>
				<Button primary danger={buttonVariant === 'danger'} onClick={onConfirm}>{forwardsLabel}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>
);

const RemoveUsersModal: FC<RemoveUsersModalParams> = ({
	onClose,
	results,
	currentStep = 1,
	...props
}) => {
	const t = useTranslation();

	const [step, setStep] = useState(currentStep);
	const username = 'Gustavo Septimus';

	const modalStepOne = (
		<RemoveUsersModalGeneric
			icon='warning'
			title={t('What would you like to do?')}
			onClose={onClose}
			onConfirm={(): void => setStep(2)}
			{...props}
		><ChannelSelectionTable results={results} username={username} />
		</RemoveUsersModalGeneric>
	);

	const modalStepTwo = (
		<RemoveUsersModalGeneric
			backwardsLabel='Back'
			forwardsLabel='Remove'
			buttonVariant='danger'
			icon='info'
			iconColor={colors.r600}
			title={t('Not Removed from')}
			onClose={onClose}
			onBack={(): void => setStep(1)}
			{...props}><>
				<Margins blockEnd='x16'>
					<Box>{ username } is the last owner of some Channels, once removed from the Team, the Channel will be kept inside the Team but the member will still be responsible for managing the Channel from outside the Team.</Box>
					<Box>{ username } is not going to be removed from the following Channels: #dev, #marketing.</Box>
					<Box>You did not select the following Channels so Gustavo Septimus will be kept on them: #common-cases.</Box>
				</Margins></>
		</RemoveUsersModalGeneric>
	);

	return step === 1 ? modalStepOne : modalStepTwo;
};

export default RemoveUsersModal;
