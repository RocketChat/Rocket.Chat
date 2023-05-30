import { useSession, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import GenericModal from '../../../components/GenericModal';
import { imperativeModal } from '../../../lib/imperativeModal';
import { useClearUnreadAllMessagesMutation } from './useClearUnreadAllMessagesMutation';

export const useEscapeKeyStroke = () => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const clearUnreadAllMessagesMutation = useClearUnreadAllMessagesMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onMutate: () => {
			imperativeModal.close();
		},
	});

	const { current: unread } = useRef(useSession('unread'));

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.code !== 'Escape' ||
				!(event.shiftKey === true || event.ctrlKey === true) ||
				unread === undefined ||
				unread === null ||
				unread === ''
			) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			imperativeModal.open({
				component: GenericModal,
				props: {
					children: t('Are_you_sure_you_want_to_clear_all_unread_messages'),
					variant: 'warning',
					title: t('Clear_all_unreads_question'),
					confirmText: t('Yes_clear_all'),
					onClose: imperativeModal.close,
					onCancel: imperativeModal.close,
					onConfirm: clearUnreadAllMessagesMutation.mutate,
				},
			});
		};

		document.body.addEventListener('keydown', handleKeyDown);

		return () => {
			document.body.removeEventListener('keydown', handleKeyDown);
		};
	}, [clearUnreadAllMessagesMutation.mutate, dispatchToastMessage, t, unread]);
};
