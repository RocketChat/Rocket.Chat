import React from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { FormSkeleton } from '../Skeleton';
import CloseChatModal from './CloseChatModal';

const CloseChatModalData = ({ departmentId, onCancel, onConfirm }) => {
	const { value: data, phase: state } = useEndpointData(`livechat/department/${departmentId}?includeAgents=false`);
	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}
	const { department } = data || {};
	return <CloseChatModal onCancel={onCancel} onConfirm={onConfirm} department={department} />;
};

export default CloseChatModalData;
