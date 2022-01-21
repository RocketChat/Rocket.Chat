import React, { ReactElement } from 'react';

import { IUser } from '../../../../../../../definition/IUser';
import { useUser } from '../../../../../../contexts/UserContext';
import { VoipInfo } from './VoipInfo';

export const VoipInfoWithData = ({ onClickClose }: { onClickClose: () => void }): ReactElement => {
	const user = useUser() as IUser | null; // TODO: change for servedByUserInfo
	const contact = { name: 'Guest test' }; // TODO: get voip caller info (connector.extension.getRegistrationInfo)

	const onClickReport = (): void => {
		// TODO: report
	};

	const onClickCall = (): void => {
		// TODO: Call
	};

	return <VoipInfo user={user} contact={contact} onClickClose={onClickClose} onClickReport={onClickReport} onClickCall={onClickCall} />;
};
