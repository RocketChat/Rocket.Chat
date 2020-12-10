import React from 'react';
import { ButtonGroup, Button, ActionButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import { withResponseData } from './withResponseData';
import VerticalBar from '../../../../client/components/VerticalBar';
import CannedResponsesForm from './CannedResponseForm';

const CannedResponseEdit = ({ response, onSave, onReturn, onClose }) => {
	const t = useTranslation();

	const { shortcut, text } = response;
	const { values, handlers } = useForm({ shortcut, text });

	const handleSave = useMutableCallback(() => {
		onSave(values, response._id);
		onReturn();
	});

	return <VerticalBar>
		<VerticalBar.Header>
			<ActionButton tiny ghost mis='none' icon='arrow-back' onClick={onReturn} />
			<VerticalBar.Text>{t('Edit_Canned_Responses')}</VerticalBar.Text>
			<VerticalBar.Close onClick={onClose} />
		</VerticalBar.Header>

		<VerticalBar.ScrollableContent>
			<CannedResponsesForm values={values} handlers={handlers}/>
		</VerticalBar.ScrollableContent>

		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button primary onClick={handleSave}>{t('Save')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</VerticalBar>;
};

export default React.memo(withResponseData(CannedResponseEdit));
