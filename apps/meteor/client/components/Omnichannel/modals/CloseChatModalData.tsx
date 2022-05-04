import { ILivechatDepartment, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
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
	const { value: data, phase: state } = useEndpointData(`livechat/department/${departmentId}`);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	// TODO: chapter day: fix issue with rest typing
	// TODO: This is necessary because of a weird problem
	// There is an endpoint livechat/department/${departmentId}/agents
	// that is causing the problem. type A | type B | undefined

	return (
		<CloseChatModal
			onCancel={onCancel}
			onConfirm={onConfirm}
			department={
				(
					data as {
						department: ILivechatDepartment | null;
						agents?: ILivechatDepartmentAgents[];
					}
				).department
			}
		/>
	);
};
export default CloseChatModalData;
