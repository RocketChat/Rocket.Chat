import {
	Box,
	Field,
	FieldGroup,
	/** @ts-ignore */
	MultiSelect,
	/** @ts-ignore */
	RadioButton,
	InputBox,
	Divider,
	TextAreaInput,
	Button,
	ButtonGroup,
} from '@rocket.chat/fuselage';
import React, { useCallback, useMemo } from 'react';

import { ISubscription } from '../../../definition/ISubscription';
import Page from '../../components/Page/Page';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useForm } from '../../hooks/useForm';

interface IEndpointSubscriptionsGet {
	value?: { update: Array<ISubscription> };
}

interface IFormValues {
	isEnabled: boolean;
	customMessage: string;
	startDate: string;
	endDate: string;
	roomIds: string[];
}

const defaultFormValues: IFormValues = {
	isEnabled: false,
	customMessage: '',
	startDate: '',
	endDate: '',
	roomIds: [],
};

function getInitialFormValues(receivedFormValues: IFormValues): IFormValues {
	if (!receivedFormValues) {
		return { ...defaultFormValues };
	}
	return {
		...defaultFormValues,
		isEnabled: !!receivedFormValues.isEnabled,
		customMessage: receivedFormValues.customMessage,
		roomIds: receivedFormValues.roomIds ?? [],
		startDate: receivedFormValues.startDate ?? '',
		endDate: receivedFormValues.endDate ?? '',
	};
}

function OutOfOfficeForm({
	receivedOutOfOfficeValues,
}: {
	receivedOutOfOfficeValues: IFormValues;
}): JSX.Element {
	const t = useTranslation() as any;
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, commit, hasUnsavedChanges } = useForm(
		getInitialFormValues(receivedOutOfOfficeValues) as any,
	);

	const { isEnabled, roomIds, customMessage, startDate, endDate }: IFormValues = values as any;

	const {
		handleIsEnabled,
		handleCustomMessage,
		handleStartDate,
		handleEndDate,
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
				startDate,
				endDate,
			}),
			[roomIds, customMessage, startDate, endDate, isEnabled],
		),
	);

	const handleSaveChanges = useCallback(async () => {
		const result = await toggleOutOfOffice();
		if (result && result.success === true) {
			dispatchToastMessage({ type: 'success', message: result.message });
			commit();
		}
	}, [commit, dispatchToastMessage, toggleOutOfOffice]);

	const {
		value: { update: subscribedRooms = [] } = { update: [] },
	}: IEndpointSubscriptionsGet = useEndpointData('subscriptions.get' as any);

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
								<Field>
									<Field.Label>{t('Start Date')}</Field.Label>
									<Field.Row>
										<InputBox
											type='datetime-local'
											flexGrow={1}
											h='x20'
											value={startDate}
											onChange={handleStartDate}
										/>
									</Field.Row>
									<Field.Hint>{t('The date when Out of Office will be enabled.')}</Field.Hint>
								</Field>
								<Field>
									<Field.Label>{t('End Date')}</Field.Label>
									<Field.Row>
										<InputBox
											type='datetime-local'
											flexGrow={1}
											h='x20'
											value={endDate}
											onChange={handleEndDate}
										/>
									</Field.Row>
									<Field.Hint>{t('The date when Out of Office will be disabled.')}</Field.Hint>
								</Field>
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
