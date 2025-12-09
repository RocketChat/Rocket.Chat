import type { CallHistoryItem, IMediaCall, Serialized } from '@rocket.chat/core-typings';
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
import { CallHistoryContextualBar } from '@rocket.chat/ui-voip';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const getContact = (item: Serialized<CallHistoryItem>, call?: Serialized<IMediaCall>) => {
	if (item.external) {
		return { number: item.contactExtension };
	}
	if (!call) {
		throw new Error('Call is required');
	}
	const { caller, callee } = call ?? {};
	const contact = caller?.id === item.contactId ? caller : callee;
	// todo fix this
	return { ...contact, _id: contact.id, username: contact.username ?? '' };
};

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
			const data = await getCallHistory({ callId: context } as any); // TODO fix this type
			const { item, call } = data;
			const { ts, callId, direction, state, duration } = item;

			const contact = getContact(item, call);
			return {
				data: {
					startedAt: new Date(ts),
					callId,
					direction,
					state,
					duration,
				},
				contact,
			};
			// return data;
		},
	});

	console.log(data);

	if (isPending) {
		return <ContextualbarSkeleton />;
	}

	if (isError || !data?.data || !data.contact) {
		return (
			<ContextualbarDialog onClose={closeTab}>
				<ContextualbarHeader>
					<ContextualbarIcon name='info-circled' />
					{/* TODO: use correct translation key Call_info */}
					<ContextualbarTitle>{t('Call_Information')}</ContextualbarTitle>
					<ContextualbarClose onClick={closeTab} />
				</ContextualbarHeader>
				{/* TODO: use a proper error message */}
				<ContextualbarEmptyContent icon='user' title={t('Contact_not_found')} />
			</ContextualbarDialog>
		);
	}

	// const contextualBarData = useMemo(() => {

	// }, [data]);

	return <CallHistoryContextualBar onClose={closeTab} actions={{}} contact={data.contact} data={data.data} />;
};

export default MediaCallHistoryContextualbar;
