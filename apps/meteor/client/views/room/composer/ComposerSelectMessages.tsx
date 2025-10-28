import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { ComposerMessageProps } from './ComposerMessage';
import { useCountSelected, useClearSelection, useAvailableMessagesCount } from '../MessageList/contexts/SelectedMessagesContext';

const ComposerSelectMessages = ({ onClickSelectAll }: ComposerMessageProps): ReactElement => {
	const { t } = useTranslation();

	const clearSelection = useClearSelection();
	const countSelected = useCountSelected();
	const countAvailable = useAvailableMessagesCount();

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent textAlign='left'>
				{t('__count__messages_selected', { count: countSelected })}
			</MessageFooterCalloutContent>
			<ButtonGroup>
				<Button small disabled={countSelected === 0} onClick={clearSelection}>
					{t('Clear_selection')}
				</Button>
				<Button icon='arrow-up' small primary disabled={countAvailable === 0} onClick={onClickSelectAll}>
					{t('Select__count__messages', { count: countAvailable })}
				</Button>
			</ButtonGroup>
		</MessageFooterCallout>
	);
};

export default ComposerSelectMessages;
