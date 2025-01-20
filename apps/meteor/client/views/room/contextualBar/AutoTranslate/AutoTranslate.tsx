import { Callout, FieldGroup, Field, FieldLabel, FieldRow, ToggleSwitch, Select } from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import type { ReactElement, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ContextualbarClose,
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarContent,
} from '../../../../components/Contextualbar';
import { useRoom } from '../../contexts/RoomContext';

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
	const { t } = useTranslation();
	const room = useRoom();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='language' />
				<ContextualbarTitle>{t('Auto_Translate')}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarContent pbs={24}>
				<FieldGroup>
					{room.encrypted && (
						<Callout title={t('Automatic_translation_not_available')} type='warning'>
							{t('Automatic_translation_not_available_info')}
						</Callout>
					)}
					<Field>
						<FieldRow>
							<FieldLabel htmlFor='automatic-translation'>{t('Automatic_Translation')}</FieldLabel>
							<ToggleSwitch
								id='automatic-translation'
								onChange={handleSwitch}
								defaultChecked={translateEnable}
								disabled={room.encrypted && !translateEnable}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor='translate-to'>{t('Translate_to')}</FieldLabel>
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
