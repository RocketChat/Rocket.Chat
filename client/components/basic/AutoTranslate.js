import React from 'react';
import { FieldGroup, Field, ToggleSwitch, Select } from '@rocket.chat/fuselage';

import VerticalBar from './VerticalBar';
import { useTranslation } from '../../contexts/TranslationContext';

const AutoTranslate = ({
	language,
	languages,
	handleSwitch,
	translateEnable,
	handleChangeLanguage,
	handleClose,
}) => {
	const t = useTranslation();

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='language'/>
			<VerticalBar.Text>{ t('Auto_Translate') }</VerticalBar.Text>
			{handleClose && <VerticalBar.Close onClick={handleClose}/>}
		</VerticalBar.Header>

		<VerticalBar.ScrollableContent>
			<FieldGroup>
				<Field.Label htmlFor='automatic-translation'>{ t('Automatic_Translation') }</Field.Label>
				<Field.Row>
					<ToggleSwitch id='automatic-translation' onChange={handleSwitch} defaultChecked={translateEnable}/>
				</Field.Row>

				<Field.Label htmlFor='language'>{ t('Language') }</Field.Label>
				<Field.Row verticalAlign='middle'>
					<Select id='language' value={language} disabled={!translateEnable} onChange={handleChangeLanguage} options={languages} />
				</Field.Row>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
	</>;
};

export default AutoTranslate;
