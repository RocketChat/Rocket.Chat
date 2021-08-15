import {
	Box,
	Field,
	FieldGroup,
	/** @ts-ignore */
	MultiSelect,
	/** @ts-ignore */
	RadioButton,
	Divider,
	TextAreaInput,
	Button,
	ButtonGroup,
} from '@rocket.chat/fuselage';
import React, { useCallback, useMemo } from 'react';

import { ISubscription } from '../../../../definition/ISubscription';
import Page from '../../../components/Page/Page';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useForm } from '../../../hooks/useForm';
import DateTimeRow from './DateTimeRow';

interface IEndpointSubscriptionsGet {
	value?: { update: Array<ISubscription> };
}

interface IReceivedFormValues {
	isEnabled: boolean;
	customMessage: string;
	startDate: string;
	endDate: string;
	roomIds: string[];
}

interface IFormValues {
	isEnabled: boolean;
	customMessage: string;
	startDateString: string;
	startTimeString: string;
	endDateString: string;
	endTimeString: string;
	roomIds: string[];
}

function getISODateStringFromDateAndTime(date: string, time: string): string {
	const dateArray = date.split('-').map((d) => parseInt(d, 10));
	const timeArray =
		time.split(':').length > 1 ? time.split(':').map((t) => parseInt(t, 10)) : [0, 0];

	const dateObject = new Date(
		dateArray[0],
		dateArray[1] - 1,
		dateArray[2],
		timeArray[0],
		timeArray[1],
	);

	return !isNaN(dateObject as any) ? dateObject.toISOString() : new Date().toISOString();
}

function getInitialFormValues(receivedFormValues: IReceivedFormValues): IFormValues {
	const startDateObject = receivedFormValues.startDate
		? new Date(receivedFormValues.startDate)
		: new Date();

	const startDateString = startDateObject.toISOString().substr(0, 10);
	const startTimeString = startDateObject.toTimeString().substr(0, 5);

	const endDateObject = receivedFormValues.endDate
		? new Date(receivedFormValues.endDate)
		: new Date();

	const endDateString = endDateObject.toISOString().substr(0, 10);
	const endTimeString = endDateObject.toTimeString().substr(0, 5);

	if (!receivedFormValues) {
		return {
			isEnabled: false,
			startDateString,
			startTimeString,
			endDateString,
			endTimeString,
			customMessage: '',
			roomIds: [],
		};
	}

	return {
		isEnabled: !!receivedFormValues.isEnabled,
		customMessage: receivedFormValues.customMessage,
		roomIds: receivedFormValues.roomIds ?? [],
		startDateString,
		startTimeString,
		endDateString,
		endTimeString,
	};
}

function OutOfOfficeForm({
	receivedOutOfOfficeValues,
}: {
	receivedOutOfOfficeValues: IReceivedFormValues;
}): JSX.Element {
	const t = useTranslation() as any;
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, commit, hasUnsavedChanges } = useForm(
		getInitialFormValues(receivedOutOfOfficeValues) as any,
	);

	const {
		isEnabled,
		roomIds,
		customMessage,
		startDateString,
		startTimeString,
		endDateString,
		endTimeString,
	}: IFormValues = values as any;

	const {
		handleIsEnabled,
		handleCustomMessage,
		handleStartDateString,
		handleStartTimeString,
		handleEndDateString,
		handleEndTimeString,
		handleRoomIds,
	} = handlers;

	const toggleOutOfOffice = useEndpointAction(
		'POST',
		'outOfOffice.toggle',
		useMemo(
			() => ({
				isEnabled,
				roomIds,
				customMessage,
				startDate: getISODateStringFromDateAndTime(startDateString, startTimeString),
				endDate: getISODateStringFromDateAndTime(endDateString, endTimeString),
			}),
			[
				roomIds,
				customMessage,
				isEnabled,
				startDateString,
				startTimeString,
				endDateString,
				endTimeString,
			],
		),
	);

	const handleSaveChanges = useCallback(async () => {
		const result = await toggleOutOfOffice();
		if (result && result.success === true) {
			dispatchToastMessage({ type: 'success', message: result.message });
			commit();
		}
	}, [commit, dispatchToastMessage, toggleOutOfOffice]);

	const { value: { update: subscribedRooms = [] } = { update: [] } }: IEndpointSubscriptionsGet =
		useEndpointData('subscriptions.get' as any);

	const roomOptions: Array<[string, string]> = useMemo(
		() => subscribedRooms.filter((s) => s.t !== 'd').map((s) => [s.rid, s.name]),
		[subscribedRooms],
	);

	return (
		<Page>
			{/* @ts-ignore */}
			<Page.Header title={t('Out Of Office')}>
				<ButtonGroup>
					<Button primary disabled={!hasUnsavedChanges} onClick={handleSaveChanges}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
				{/* @ts-ignore */}
			</Page.Header>
			{/* @ts-ignore */}
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x800' w='full' alignSelf='center'>
					<FieldGroup>
						<Field>
							<Box display='flex' justifyContent='flex-start' alignItems='center'>
								<Field.Row>
									<RadioButton checked={!isEnabled} onChange={(): void => handleIsEnabled(false)} />
								</Field.Row>
								<Field.Row>
									<Box display='flex' flexDirection='column'>
										<Field.Label>Disable Out Of Office</Field.Label>
									</Box>
								</Field.Row>
							</Box>
						</Field>
						<Field>
							<Box display='flex' justifyContent='flex-start' alignItems='center'>
								<Field.Row>
									<RadioButton checked={isEnabled} onChange={(): void => handleIsEnabled(true)} />
								</Field.Row>
								<Field.Row>
									<Box display='flex' flexDirection='column'>
										<Field.Label>Enable Out Of Office</Field.Label>
									</Box>
								</Field.Row>
							</Box>
						</Field>
					</FieldGroup>
					{isEnabled && (
						<>
							<Divider />
							<FieldGroup>
								<DateTimeRow
									label={t('Start Date')}
									dateTime={{ date: startDateString, time: startTimeString }}
									handleDateTime={{ date: handleStartDateString, time: handleStartTimeString }}
								/>

								<DateTimeRow
									label={t('End Date')}
									dateTime={{ date: endDateString, time: endTimeString }}
									handleDateTime={{ date: handleEndDateString, time: handleEndTimeString }}
								/>
							</FieldGroup>
							<FieldGroup marginBlock='x16'>
								<Field>
									<Field.Label>{t('Reply Message')}</Field.Label>
									<Field.Row>
										<TextAreaInput value={customMessage} onChange={handleCustomMessage} rows={2} />
									</Field.Row>
									<Field.Hint>
										{t('A message which will be auto sent while you have enabled Out of Office')}
									</Field.Hint>
								</Field>
							</FieldGroup>
							<FieldGroup>
								<Field>
									<Field.Label>{t('Select the Channels for Out of Office')}</Field.Label>
									<Field.Row>
										<MultiSelect
											value={roomIds}
											placeholder={'channels to be selected'}
											options={roomOptions}
											onChange={handleRoomIds}
											maxWidth='100%'
											flexGrow={1}
										/>
									</Field.Row>
								</Field>
							</FieldGroup>
						</>
					)}
				</Box>
				{/* @ts-ignore */}
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default OutOfOfficeForm;
