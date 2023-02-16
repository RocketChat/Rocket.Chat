import type { ILivechatTrigger, Serialized } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import PageSkeleton from '../../../components/PageSkeleton';
import type { TriggerFormValues } from './TriggersForm';
import TriggersForm from './TriggersForm';

const getInitialValues = ({
	name,
	description,
	enabled,
	runOnce,
	conditions: [{ name: condName, value: condValue }],
	actions: [
		{ name: actName, params: { sender: actSender, msg: actMsg, name: actSenderName } = { sender: 'queue' as const, msg: '', name: '' } },
	],
}: Serialized<ILivechatTrigger>): TriggerFormValues => ({
	name: name ?? '',
	description: description ?? '',
	enabled: !!enabled,
	runOnce: !!runOnce,
	conditions: {
		name: condName ?? 'page-url',
		value: condValue ?? '',
	},
	actions: {
		name: actName ?? '',
		params: {
			sender: actSender ?? 'queue',
			msg: actMsg ?? '',
			name: actSenderName ?? '',
		},
	},
});

const TriggersFormWithData = ({ onSave, id }: { onSave: (values: TriggerFormValues) => Promise<void>; id: string }) => {
	const t = useTranslation();
	const getTrigger = useEndpoint('GET', '/v1/livechat/triggers/:_id', { _id: id });
	const { data, isInitialLoading, isError } = useQuery(['/v1/livechat/triggers/:_id', id], () => getTrigger());

	if (isInitialLoading) {
		return <PageSkeleton />;
	}

	if (isError || !data?.trigger) {
		return <Callout>{t('Error')}: error</Callout>;
	}

	return (
		<>
			<TriggersForm initialValues={getInitialValues(data.trigger)} onSave={onSave} />
		</>
	);
};

export default TriggersFormWithData;
