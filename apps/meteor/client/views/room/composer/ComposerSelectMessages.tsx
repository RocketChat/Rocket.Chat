import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import type { ComposerMessageProps } from './ComposerMessage';
import { useCountSelected, useClearSelection, SelectedMessageContext } from '../MessageList/contexts/SelectedMessagesContext';

const ComposerSelectMessages = ({ onGetMore }: ComposerMessageProps): ReactElement => {
	const { t } = useTranslation();

	const { selectedMessageStore } = useContext(SelectedMessageContext);
	const clearSelection = useClearSelection();
	const countSelected = useCountSelected();
	const countAvailable = selectedMessageStore.availableMessages.size;
	const noMessagesAvailable = countAvailable <= countSelected;

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>
				<div>{countSelected} messages selected</div>
			</MessageFooterCalloutContent>
			<ButtonGroup>
				<Button small disabled={countSelected === 0} onClick={clearSelection}>
					{t('Clear_selection')}
				</Button>
				<Button small primary disabled={noMessagesAvailable} onClick={onGetMore}>
					{t(`Batch select ${countAvailable - countSelected} available`)}
				</Button>
			</ButtonGroup>
		</MessageFooterCallout>
	);
};

export default ComposerSelectMessages;
