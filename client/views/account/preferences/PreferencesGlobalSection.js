import React, { useMemo } from 'react';
import { Accordion, Field, FieldGroup, MultiSelect } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useUserPreference } from '../../../contexts/UserContext';
import { useForm } from '../../../hooks/useForm';

const PreferencesGlobalSection = ({ onChange, ...props }) => {
	const t = useTranslation();

	const userDontAskAgainList = useUserPreference('dontAskAgainList');

	const options = useMemo(() => (userDontAskAgainList || []).map(({ action, label }) => [action, label]), [userDontAskAgainList]);

	const selectedOptions = options.map(([action]) => action);

	const { values, handlers } = useForm({ dontAskAgainList: selectedOptions }, onChange);

	const { dontAskAgainList } = values;

	const { handleDontAskAgainList } = handlers;

	return <Accordion.Item title={t('Global')} {...props}>
		<FieldGroup>
			<Field>
				<Field.Label>
					{t('Dont_ask_me_again_list')}
				</Field.Label>
				<Field.Row>
					<MultiSelect
						placeholder={t('Nothing_found')}
						value={(dontAskAgainList.length > 0 && dontAskAgainList) || undefined}
						onChange={handleDontAskAgainList}
						options={options}
					/>
				</Field.Row>
			</Field>
		</FieldGroup>
	</Accordion.Item>;
};

export default PreferencesGlobalSection;
