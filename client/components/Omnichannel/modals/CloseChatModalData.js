import React from 'react';

import { useOmnichannelDepartments } from '../../../contexts/OmnichannelContext/OmnichannelDepartmentContext';
import CloseChatModal from './CloseChatModal';

const CloseChatModalData = ({ departmentId, onCancel, onConfirm }) => {
	const department =
		useOmnichannelDepartments().find((department) => department._id === departmentId) || {};

	return <CloseChatModal onCancel={onCancel} onConfirm={onConfirm} department={department} />;
};

export default CloseChatModalData;
