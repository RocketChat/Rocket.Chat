import React, { useCallback, useEffect, useMemo } from 'react';
import {
	Box,
	Field,
	FieldGroup,
	/**@ts-ignore */
	MultiSelect,
	/**@ts-ignore */
	RadioButton,
	InputBox,
	Divider,
	TextAreaInput,
	Button,
	ButtonGroup,
} from '@rocket.chat/fuselage';

import { ISubscription } from '/definition/ISubscription';
import Page from '/client/components/Page/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '/client/hooks/useForm';
import { useEndpointData } from '/client/hooks/useEndpointData';

interface IEndpointSubscriptionsGet {
	value?: { update: Array<ISubscription> };
}

const defaultFormValues = {
	outOfOfficeEnabled: false,
	customMessage: '',
	startDate: '',
	endDate: '',
    roomIds:[]
};

function OutOfOfficePage() {
	const t = useTranslation() as any;

	const { values, handlers, commit, hasUnsavedChanges } = useForm(defaultFormValues);

	const { outOfOfficeEnabled, customMessage, startDate, endDate, roomIds } = values;

	const {
		handleOutOfOfficeEnabled,
		handleCustomMessage,
		handleStartDate,
		handleEndDate,
        handleRoomIds
	} = handlers;

	const handleSaveChanges = useCallback(() => {
		commit();
		console.log(values, 'after saving the changes');
	}, [commit, values]);

    const {
		value: { update: subscribedRooms = [] } = { update: [] },
	}: IEndpointSubscriptionsGet = useEndpointData('subscriptions.get' as any);

	const roomOptions: Array<[string, string]> = useMemo(() => {
		return subscribedRooms.filter((s) => s.t !== 'd').map((s) => [s.rid, s.name]);
	}, [subscribedRooms]);

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
							<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
								<Field.Label>Disable Out Of Office</Field.Label>
								<Field.Row>
									<RadioButton
										checked={!outOfOfficeEnabled}
										onChange={() => handleOutOfOfficeEnabled(false)}
									/>
								</Field.Row>
							</Box>
							<Field.Hint>{t('Out of Office will be disabled')}</Field.Hint>
						</Field>
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
								<Field.Label>Enable Out Of Office</Field.Label>
								<Field.Row>
									<RadioButton
										checked={outOfOfficeEnabled}
										onChange={() => handleOutOfOfficeEnabled(true)}
									/>
								</Field.Row>
							</Box>
							<Field.Hint>{t('Out of Office will be enabled')}</Field.Hint>
						</Field>
					</FieldGroup>
					{outOfOfficeEnabled && (
						<>
							<Divider />
							<FieldGroup>
								<Field>
									<Field.Label>{t('Start Date')}</Field.Label>
									<Field.Row>
										<InputBox
											type='date'
											flexGrow={1}
											h='x20'
											value={startDate as string}
											onChange={handleStartDate}
										/>
									</Field.Row>
									<Field.Hint>{t('The date when Out of Office will be enabled.')}</Field.Hint>
								</Field>
								<Field>
									<Field.Label>{t('End Date')}</Field.Label>
									<Field.Row>
										<InputBox
											type='date'
											flexGrow={1}
											h='x20'
											value={endDate as string}
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
										<TextAreaInput
											value={customMessage as string}
											onChange={handleCustomMessage}
											rows={2}
										/>
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

export default OutOfOfficePage;
