import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import VerticalBar from '../../../../client/components/VerticalBar';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import CannedResponsesForm from './CannedResponseForm';
import { withResponseData } from './withResponseData';

const CannedResponseEdit = ({ response, onSave, onReturn, onClose }) => {
	const t = useTranslation();
	const [errors, setErrors] = useState();

	const { values, handlers } = useForm({ shortcut: response.shortcut, text: response.text });
	const { shortcut, text } = values;

	const handleSave = useMutableCallback(() => {
		if (!shortcut) {
			return setErrors({ shortcut: t('The_field_is_required', 'shortcut') });
		}
		if (!text) {
			return setErrors({ text: t('The_field_is_required', 'text') });
		}

		setErrors({});

		onSave(values, response._id);
		onReturn();
	});

	return (
		<VerticalBar>
			<VerticalBar.Header>
				<VerticalBar.Back onClick={onReturn} />
				<VerticalBar.Text>{t('Edit_Canned_Responses')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent>
				<CannedResponsesForm errors={errors} values={values} handlers={handlers} />
			</VerticalBar.ScrollableContent>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button primary onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</VerticalBar>
	);
};

export default React.memo(withResponseData(CannedResponseEdit));
