import React from 'react';
import { ButtonGroup, Button, ActionButton } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import VerticalBar from '../../../../client/components/VerticalBar';
import CannedResponsesForm from './CannedResponseForm';

const CannedResponseEdit = ({ shortcut, text, onSave, onReturn, onClose }) => {
	console.log();

	const t = useTranslation();

	const { values, handlers } = useForm({ shortcut, text });

	return <VerticalBar>
		<VerticalBar.Header>
			<ActionButton tiny ghost mis='none' icon='arrow-back' onClick={onReturn} />
			<VerticalBar.Text>{t('New_Canned_Response')}</VerticalBar.Text>
			<VerticalBar.Close onClick={onClose} />
		</VerticalBar.Header>

		<VerticalBar.ScrollableContent>
			<CannedResponsesForm values={values} handlers={handlers}/>
		</VerticalBar.ScrollableContent>

		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button primary onClick={onSave}>{t('Save')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</VerticalBar>;
};

export default React.memo(CannedResponseEdit);
