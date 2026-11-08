import type { IMessage } from '@rocket.chat/core-typings';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ComposerMessageProps } from './ComposerMessage';
import { sdk } from '../../../lib/SDKClient';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { Messages } from '../../../stores';
import {
	useCountSelected,
	useClearSelection,
	useResetSelection,
	useAvailableMessagesCount,
} from '../MessageList/contexts/SelectedMessagesContext';
import ForwardMessageModal from '../modals/ForwardMessageModal';
import { selectedMessageStore } from '../providers/SelectedMessagesProvider';

const ComposerSelectMessages = ({ onClickSelectAll }: Pick<ComposerMessageProps, 'onClickSelectAll'>) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const [isLoading, setIsLoading] = useState(false);

	const clearSelection = useClearSelection();
	const resetSelection = useResetSelection();
	const countSelected = useCountSelected();
	const countAvailable = useAvailableMessagesCount();

	const handleForward = useCallback(async () => {
		const mids = selectedMessageStore.getSelectedMessages();
		if (!mids.length) {
			return;
		}

		setIsLoading(true);

		try {
			const resolvedMessages: IMessage[] = [];

			for (const mid of mids) {
				const cached = Messages.state.get(mid);
				if (cached) {
					resolvedMessages.push(cached);
				} else {
					try {
						const response = await sdk.rest.get('/v1/chat.getMessage', { msgId: mid });
						if (response?.message) {
							resolvedMessages.push(mapMessageFromApi(response.message));
						}
					} catch {
						// Ignore individual message fetch error
					}
				}
			}

			if (!resolvedMessages.length) {
				return;
			}

			resolvedMessages.sort((a, b) => {
				const timeA = a.ts instanceof Date ? a.ts.getTime() : new Date(a.ts).getTime();
				const timeB = b.ts instanceof Date ? b.ts.getTime() : new Date(b.ts).getTime();
				return timeA - timeB;
			});

			setModal(
				<ForwardMessageModal
					messages={resolvedMessages}
					onClose={() => {
						setModal(null);
						selectedMessageStore.reset();
					}}
				/>,
			);
		} finally {
			setIsLoading(false);
		}
	}, [setModal]);

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent textAlign='left'>
				{t('__count__messages_selected', { count: countSelected })}
			</MessageFooterCalloutContent>
			<ButtonGroup>
				<Button small onClick={resetSelection}>
					{t('Cancel')}
				</Button>
				<Button small disabled={countSelected === 0} onClick={clearSelection}>
					{t('Clear_selection')}
				</Button>
				<Button icon='arrow-up' small disabled={countAvailable === 0} onClick={onClickSelectAll}>
				<Button size='small' disabled={countSelected === 0} onClick={clearSelection}>
					{t('Clear_selection')}
				</Button>
				<Button icon='arrow-up' size='small' variant='primary' disabled={countAvailable === 0} onClick={onClickSelectAll}>
					{t('Select__count__messages', { count: countAvailable })}
				</Button>
				<Button
					icon='arrow-forward'
					small
					primary
					disabled={countSelected === 0 || isLoading}
					loading={isLoading}
					onClick={handleForward}
				>
					{t('Forward')}
				</Button>
			</ButtonGroup>
		</MessageFooterCallout>
	);
};

export default ComposerSelectMessages;
