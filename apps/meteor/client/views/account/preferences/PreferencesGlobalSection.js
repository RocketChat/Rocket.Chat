import { Accordion, Field, FieldGroup, MultiSelect, ToggleSwitch, Callout } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { useForm } from '../../../hooks/useForm';

const PreferencesGlobalSection = ({ onChange, commitRef, ...props }) => {
	const t = useTranslation();

	const userDontAskAgainList = useUserPreference('dontAskAgainList');
	const userEnableNewMessageTemplate = useUserPreference('enableNewMessageTemplate');

	const options = useMemo(() => (userDontAskAgainList || []).map(({ action, label }) => [action, label]), [userDontAskAgainList]);

	const selectedOptions = options.map(([action]) => action);

	const { values, handlers, commit } = useForm(
		{
			dontAskAgainList: selectedOptions,
			enableNewMessageTemplate: userEnableNewMessageTemplate,
		},
		onChange,
	);

	const { dontAskAgainList, enableNewMessageTemplate } = values;

	const { handleDontAskAgainList, handleEnableNewMessageTemplate } = handlers;

	commitRef.current.global = commit;

	return (
		<Accordion.Item title={t('Global')} {...props}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Dont_ask_me_again_list')}</Field.Label>
					<Field.Row>
						<MultiSelect
							placeholder={t('Nothing_found')}
							value={(dontAskAgainList.length > 0 && dontAskAgainList) || undefined}
							onChange={handleDontAskAgainList}
							options={options}
						/>
					</Field.Row>
				</Field>
				<Field display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Enable_New_Message_Template')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={enableNewMessageTemplate} onChange={handleEnableNewMessageTemplate} />
					</Field.Row>
				</Field>
				<Callout type='warning'>{t('Enable_New_Message_Template_alert')}</Callout>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesGlobalSection;
