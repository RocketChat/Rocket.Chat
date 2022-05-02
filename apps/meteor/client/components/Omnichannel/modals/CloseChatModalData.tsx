import { ILivechatDepartment } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { FormSkeleton } from '../Skeleton';
import CloseChatModal from './CloseChatModal';

const CloseChatModalData = ({
	departmentId,
	onCancel,
	onConfirm,
}: {
	departmentId: ILivechatDepartment['_id'];
	onCancel: () => void;
	onConfirm: (comment?: string, tags?: string[]) => Promise<void>;
}): ReactElement => {
	const { value: data, phase: state } = useEndpointData(`livechat/department/${departmentId}?includeAgents=false`);

	// // TODO: This is necessery because of a weird problem
	// // There is an endpoint livechat/department/${departmentId}/agents
	// // that is causing the problem. type A | type B | undefined
	const castingData = data as unknown as {
		department: ILivechatDepartment | null;
		agents?: any[];
	};

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	return <CloseChatModal onCancel={onCancel} onConfirm={onConfirm} department={castingData?.department} />;
};
export default CloseChatModalData;
