import type { ILivechatInquiryRecord, IOmnichannelAgent } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LivechatInquiry } from '../../../app/livechat/client/collections/LivechatInquiry';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { queryClient } from '../../lib/queryClient';

const getAgentDepartments = async (userId: IOmnichannelAgent['_id']) => {
	const { departments } = await sdk.rest.get(`/v1/livechat/agents/${userId}/departments`, { enabledDepartmentsOnly: 'true' });
	return departments;
};

const invalidateRoomQueries = async (rid: string) => {
	await queryClient.invalidateQueries(['rooms', { reference: rid, type: 'l' }]);
	await queryClient.removeQueries(['rooms', rid]);
	await queryClient.removeQueries(['/v1/rooms.info', rid]);
};

const useAgentDepartments = (userId: string) => {
	const { data: departments } = useQuery(
		[userId],
		() => sdk.rest.get(`/v1/livechat/agents/${userId}/departments`, { enabledDepartmentsOnly: 'true' }),
		{
			enabled,
			select: (data) => data.departments,
		},
	);

	return departments;
};

const useAgentQueueObserver = (userId: string, events: QueueObserverEvents, enabled: boolean) => {
	const stableEvents = useRef(events);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const departments = getAgentDepartments(userId).map((dep) => `department/${dep}`);
		sdk.stream('livechat-inquiry-queue-observer', ['public', ...departments], async (args) => {
			if (!('type' in args)) {
				return;
			}

			const { type, ...inquiry } = args;
			await stableEvents.current[args.type](inquiry);
		});
	}, [enabled, userId]);
};

export const useQueueManager = ({ userId, maxInquiries, enabled }: QueueManagerParams) => {
	useQuery([maxInquiries], () => sdk.rest.get('/v1/livechat/inquiries.queuedForUser', { count: maxInquiries }), {
		enabled,
		select: (data) => data.inquiries,
		onSuccess: async (data) => {
			await LivechatInquiry.remove({});
			await Promise.all(data.map((inquiry) => LivechatInquiry.insertAsync({ ...inquiry, _updatedAt: new Date(inquiry._updatedAt) })));
		},
	});

	const onInquiryAdded = useCallback((inquiry: ILivechatInquiryRecord) => {
		LivechatInquiry.insert({ ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
		invalidateRoomQueries(inquiry.rid);
	}, []);

	const onInquiryRemoved = useCallback(async (inquiry: ILivechatInquiryRecord) => {
		await LivechatInquiry.remove(inquiry._id);
		return queryClient.invalidateQueries(['rooms', { reference: inquiry.rid, type: 'l' }]);
	}, []);

	const onInquiryChanged = useCallback(
		(inquiry: ILivechatInquiryRecord) => {
			if (inquiry.status !== 'queued') {
				return onInquiryRemoved(inquiry);
			}

			LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
			invalidateRoomQueries(inquiry.rid);
		},
		[onInquiryRemoved],
	);

	const events = {
		added: onInquiryAdded,
		changed: onInquiryChanged,
		removed: onInquiryRemoved,
	};

	useAgentQueueObserver(userId, events, enabled);
};
