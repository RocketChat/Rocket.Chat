import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../contexts/TranslationContext';
import Page from '/client/components/Page/Page';

function OutOfOfficePage() {
	const t = useTranslation() as any;

	const [oooEnabled, toggleOOOEnabled] = useToggle(false);
    const [customMessage, setCustomMessage] = useState('');

	return (
		<Page>
			{/* @ts-ignore */}
			<Page.Header title={t('Out Of Office')} />
			{/* @ts-ignore */}
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x800' w='full' alignSelf='center'>
					<FieldGroup>
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
								<Field.Label>Disable Out Of Office</Field.Label>
								<Field.Row>
									<RadioButton checked={!oooEnabled} onChange={toggleOOOEnabled as any} />
								</Field.Row>
							</Box>
							<Field.Hint>{t('Out of Office will be disabled')}</Field.Hint>
						</Field>
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
								<Field.Label>Enable Out Of Office</Field.Label>
								<Field.Row>
									<RadioButton checked={oooEnabled} onChange={toggleOOOEnabled as any} />
								</Field.Row>
							</Box>
							<Field.Hint>{t('Out of Office will be enabled')}</Field.Hint>
						</Field>
					</FieldGroup>
					{oooEnabled && (
						<>
							<Divider />
							<FieldGroup>
								<Field>
									<Field.Label>{t('Start Date')}</Field.Label>
									<Field.Row>
										<InputBox type='date' flexGrow={1} h='x20' />
									</Field.Row>
									<Field.Hint>{t('The date when Out of Office will be enabled.')}</Field.Hint>
								</Field>
								<Field>
									<Field.Label>{t('End Date')}</Field.Label>
									<Field.Row>
										<InputBox type='date' flexGrow={1} h='x20' />
									</Field.Row>
									<Field.Hint>{t('The date when Out of Office will be disabled.')}</Field.Hint>
								</Field>
							</FieldGroup>
							<FieldGroup marginBlock='x16'>
								<Field>
									<Field.Label>{t('Reply Message')}</Field.Label>
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
