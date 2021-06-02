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

import { useTranslation } from '../../contexts/TranslationContext';
import Page from '/client/components/Page/Page';
import { useForm } from '/client/hooks/useForm';

const defaultFormValues = {
	outOfOfficeEnabled: false,
	customMessage: '',
	startDate: '',
	endDate: '',
};

function OutOfOfficePage() {
	const t = useTranslation() as any;

	const { values, handlers, commit, hasUnsavedChanges } = useForm(defaultFormValues);

	const { outOfOfficeEnabled, customMessage, startDate, endDate } = values;

	const {
		handleOutOfOfficeEnabled,
		handleCustomMessage,
		handleStartDate,
		handleEndDate,
	} = handlers;

	const handleSaveChanges = useCallback(() => {
		commit();
		console.log(values);
	}, [commit, values]);

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
										<InputBox type='date' flexGrow={1} h='x20' value={endDate as string} onChange={handleEndDate}/>
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
						</>
					)}
				</Box>
				{/* @ts-ignore */}
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default OutOfOfficePage;
