import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarDialog,
	ContextualbarSkeleton,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import MediaCallHistoryExternal, { isExternalCallHistoryItem } from './MediaCallHistoryExternal';
import MediaCallHistoryInternal, { isInternalCallHistoryItem } from './MediaCallHistoryInternal';

export const MediaCallHistoryContextualbar = () => {
	const context = useRouteParameter('context');

	const { closeTab } = useRoomToolbox();
	const { t } = useTranslation();

	const getCallHistory = useEndpoint('GET', '/v1/call-history.info');
	const { data, isError, isPending } = useQuery({
		queryKey: ['call-history', context],
		queryFn: async () => {
			if (!context) {
				throw new Error('Call ID is required');
			}
			return getCallHistory({ callId: context } as any); // TODO fix this type
		},
		staleTime: Infinity, // Call history should never change...
	});

	if (isPending) {
		return <ContextualbarSkeleton />;
	}

	if (isError || !data?.item || !data.call) {
		return (
			<ContextualbarDialog onClose={closeTab}>
				<ContextualbarHeader>
					<ContextualbarIcon name='info-circled' />
					<ContextualbarTitle>{t('Call_info')}</ContextualbarTitle>
					<ContextualbarClose onClick={closeTab} />
				</ContextualbarHeader>
				<ContextualbarEmptyContent icon='warning' title={t('Call_info_could_not_be_loaded')} subtitle={t('Please_try_again')} />
			</ContextualbarDialog>
		);
	}

	if (isInternalCallHistoryItem(data)) {
		return <MediaCallHistoryInternal onClose={closeTab} data={data} />;
	}

	if (isExternalCallHistoryItem(data)) {
		return <MediaCallHistoryExternal onClose={closeTab} data={data} />;
	}

	throw new Error('Invalid call history item');
};

export default MediaCallHistoryContextualbar;
