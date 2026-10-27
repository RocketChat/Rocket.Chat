import { Box, Callout, FieldGroup, Field, FieldLabel, FieldRow, ToggleSwitch, Select } from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	ContextualbarClose,
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useId } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../contexts/RoomContext';

export type AutoTranslateProps = {
	language: string;
	languages: SelectOption[];
	handleSwitch: (e: ChangeEvent<HTMLInputElement>) => void;
	translateEnable: boolean | undefined;
	handleChangeLanguage: (value: string) => void;
	handleClose?: () => void;
};

const AutoTranslate = ({ language, languages, handleSwitch, translateEnable, handleChangeLanguage, handleClose }: AutoTranslateProps) => {
	const { t } = useTranslation();
	const room = useRoom();
	const autoTranslateId = useId();
	const translateToId = useId();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='language' />
				<ContextualbarTitle>{t('Auto_Translate')}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarContent>
				<Box paddingBlockStart='x24'>
					<FieldGroup>
						{room.encrypted && (
							<Callout title={t('Automatic_translation_not_available')} type='warning'>
								{t('Automatic_translation_not_available_info')}
							</Callout>
						)}
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={autoTranslateId}>{t('Automatic_Translation')}</FieldLabel>
								<ToggleSwitch
									id={autoTranslateId}
									onChange={handleSwitch}
									defaultChecked={translateEnable}
									disabled={room.encrypted && !translateEnable}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={translateToId}>{t('Translate_to')}</FieldLabel>
							<FieldRow>
								<Select
									id={translateToId}
									value={language}
									disabled={!translateEnable}
									onChange={(value) => handleChangeLanguage(String(value))}
									options={languages}
								/>
							</FieldRow>
						</Field>
					</FieldGroup>
				</Box>
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default AutoTranslate;
