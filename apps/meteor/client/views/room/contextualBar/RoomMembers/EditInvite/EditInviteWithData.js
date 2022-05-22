import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useTabBarClose } from '../../../providers/ToolboxProvider';
import EditInvite from './EditInvite';

const EditInviteWithData = ({ onClickBack, setParams, linkText, captionText, days: _days, maxUses: _maxUses }) => {
	const onClickClose = useTabBarClose();

	const [days, setDays] = useState(_days);
	const [maxUses, setMaxUses] = useState(_maxUses);

	const generateLink = useMutableCallback(() => {
		setParams({
			days,
			maxUses,
		});
	});

	return (
		<EditInvite
			onClickBack={onClickBack}
			onClickClose={onClickClose}
			onClickNewLink={generateLink}
			setDays={setDays}
			days={days}
			maxUses={maxUses}
			setMaxUses={setMaxUses}
			linkText={linkText}
			captionText={captionText}
		/>
	);
};

export default EditInviteWithData;
