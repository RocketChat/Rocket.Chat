import { FieldGroup, Field, FieldLabel, FieldRow, ToggleSwitch, Select } from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent } from 'react';
import React from 'react';

import {
	ContextualbarClose,
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarContent,
} from '../../../../components/Contextualbar';

type AutoTranslateProps = {
	language: string;
	languages: SelectOption[];
	handleSwitch: (e: ChangeEvent<HTMLInputElement>) => void;
	translateEnable: boolean | undefined;
	handleChangeLanguage: (value: string) => void;
	handleClose?: () => void;
};

const AutoTranslate = ({
	language,
	languages,
	handleSwitch,
	translateEnable,
	handleChangeLanguage,
	handleClose,
}: AutoTranslateProps): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='language' />
				<ContextualbarTitle>{t('Auto_Translate')}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarContent pbs={24}>
				<FieldGroup>
					<Field>
						<FieldRow>
							<ToggleSwitch id='automatic-translation' onChange={handleSwitch} defaultChecked={translateEnable} />
							<FieldLabel htmlFor='automatic-translation'>{t('Automatic_Translation')}</FieldLabel>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor='language'>{t('Language')}</FieldLabel>
						<FieldRow verticalAlign='middle'>
							<Select
								id='language'
								value={language}
								disabled={!translateEnable}
								onChange={(value) => handleChangeLanguage(String(value))}
								options={languages}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</ContextualbarContent>
		</>
	);
};

export default AutoTranslate;
