import React, { FC, memo, MouseEventHandler } from 'react';

// import CannedResponse from './CannedResponse';

const WrapCannedResponse: FC<{ departmentId: any }> = ({ departmentId }) => {
	const onClickBack: MouseEventHandler<HTMLOrSVGElement> = () => {
		console.log(departmentId);
	};

	// return <CannedResponse data={{ shortcut: 't' }} onClickBack={onClickBack} />;
	return <div onClick={onClickBack}>bro</div>;
};

export default memo(WrapCannedResponse);
