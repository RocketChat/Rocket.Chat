import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Accordion,
	Box,
	Button,
	Field,
	FieldGroup,
	TextAreaInput,
	InputBox,
	ToggleSwitch,
	/**@ts-ignore */
	MultiSelect,
} from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { useEndpointData } from '../../hooks/useEndpointData';
import UserAutoComplete from '../../components/UserAutoComplete';
import { ISubscription } from '../../../definition/ISubscription';

function OutOfOfficePage({ ...props }) {
	const t = useTranslation() as any;

	const [rooms, setRooms] = useState<string[]>([]);
	const [deputy, setDeputy] = useState(''); // contains the username
	const [customMessage, setCustomMessage] = useState(`Hello everyone.
I am currently Out of Office`);
	const [OOOEnabled, setOOOEnabled] = useState(false);
	const [firstDateDisabled, setFirstDateDisabled] = useState(true);
	const [lastDateDisabled, setLastDateDisabled] = useState(true);

	const handleAddRooms = (roomIds: string[]) => {
		setRooms([...roomIds]);
	};

	const {
		value: { update: subscribedRooms = [] } = { update: [] },
	}: IEndpointSubscriptionsGet = useEndpointData('subscriptions.get' as any);

	const roomOptions: Array<[string, string]> = useMemo(() => {
		return subscribedRooms.filter((s) => s.t !== 'd').map((s) => [s.rid, s.name]);
	}, [subscribedRooms]);

	const enableEndpoint = useEndpointAction(
		'POST',
		'users.outOfOffice.enable',
		useMemo(
			() => ({
				enable: true,
				roomIds: rooms,
				deputyUsername: deputy,
				customMessage,
			}),
			[rooms, deputy, customMessage],
		),
		t('OUT OF OFFICE ENABLED'),
	);

	const disableEndpoint = useEndpointAction(
		'POST',
		'users.outOfOffice.disable',
		useMemo(() => ({ enable: false }), []),
		t('OUT OF OFFICE DISABLED'),
	);

	const enableOutOfOffice = useCallback(async () => {
		await enableEndpoint();
		setOOOEnabled(true);
	}, [enableEndpoint]);

	const disableOutOfOffice = useCallback(async () => {
		await disableEndpoint();
		setOOOEnabled(false);
	}, [disableEndpoint]);

	const { value: { isOutOfOffice = false } = { isOutOfOffice: false } } = useEndpointData(
		'users.outOfOffice.info' as any,
	);

	useEffect(() => {
		setOOOEnabled(isOutOfOffice);
	}, [isOutOfOffice, setOOOEnabled]);

	return (
		// change the buttons to toggle switches so that useForm can be used
		<Accordion.Item title={t('Out Of Office')} {...props}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Select the Channels for Out of Office')}</Field.Label>
					<Field.Row>
						<MultiSelect
							placeholder={'channels to be selected'}
							options={roomOptions}
							onChange={handleAddRooms}
							maxWidth='100%'
							flexGrow={1}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Select the assigning deputy')}</Field.Label>
					<Field.Row>
						<UserAutoComplete
							/*
            // @ts-ignore */
							value={deputy}
							onChange={setDeputy}
							placeholder={'select the user'}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label>{t('Enable Out Of Office')}</Field.Label>
						<Field.Row>
							<Button onClick={enableOutOfOffice} disabled={OOOEnabled}>
								Enable
							</Button>
						</Field.Row>
					</Box>
					<Field.Hint>
						{t('You will be Out of Office with your message being sent to the selected channels')}
					</Field.Hint>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label>{t('Disable Out Of Office')}</Field.Label>
						<Field.Row>
							<Button onClick={disableOutOfOffice} disabled={!OOOEnabled}>
								Disable
							</Button>
						</Field.Row>
					</Box>
					<Field.Hint>{t('You will be in Office and take command from your Deputy')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Custom Message')}</Field.Label>
					<Field.Row>
						<TextAreaInput
							value={customMessage}
							onChange={(e) => setCustomMessage((e.target as any).value)}
							rows={2}
						/>
					</Field.Row>
					<Field.Hint>
						{t('A message which will be auto sent while you have enabled Out of Office')}
					</Field.Hint>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label>{t('First Day')}</Field.Label>
						<ToggleSwitch
							checked={!firstDateDisabled}
							onChange={() => setFirstDateDisabled((prev) => !prev)}
						/>
					</Box>
					<Field.Row>
						<InputBox
							type='date'
							disabled={firstDateDisabled}
							// value={dateTime?.date}
							// onChange={handleDateTime?.date}
							flexGrow={1}
							h='x20'
						/>
					</Field.Row>
					<Field.Hint>{t('The date when Out of Office will be enabled.')}</Field.Hint>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label>{t('Last Day')}</Field.Label>
						<ToggleSwitch
							checked={!lastDateDisabled}
							onChange={() => setLastDateDisabled((prev) => !prev)}
						/>
					</Box>
					<Field.Row>
						<InputBox
							disabled={lastDateDisabled}
							type='date'
							// onChange={handleDateTime?.date}
							flexGrow={1}
							h='x20'
						/>
					</Field.Row>
					<Field.Hint>{t('The date when Out of Office will be disabled.')}</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
}

interface IEndpointSubscriptionsGet {
	value?: { update: Array<ISubscription> };
}

export default OutOfOfficePage;
