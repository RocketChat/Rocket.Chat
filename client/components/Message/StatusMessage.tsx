import React, { FC, memo } from 'react';

import { useUserData } from '../../hooks/useUserData';

const StatusMessage: FC<{ uid: string }> = ({ uid }) => {
	const data = useUserData(uid);

	if (!data || !data.statusText) {
		return null;
	}

	return (
		<button className='message-custom-status' title={data.statusText}>
			💬
		</button>
	);
};

export default memo(StatusMessage);
