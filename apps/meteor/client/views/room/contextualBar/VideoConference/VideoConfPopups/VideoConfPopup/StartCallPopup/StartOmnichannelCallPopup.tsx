import { IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfPopup,
	VideoConfPopupContent,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupTitle,
	VideoConfPopupFooterButtons,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, forwardRef, Ref } from 'react';

import RoomAvatar from '../../../../../../../components/avatar/RoomAvatar';

type StartOmnichannelCallPopup = {
	room: IRoom;
	onConfirm: () => void;
	loading?: boolean;
};

const StartOmnichannelCallPopup = forwardRef(function StartOmnichannelCallPopup(
	{ room, onConfirm, loading }: StartOmnichannelCallPopup,
	ref: Ref<HTMLDivElement>,
): ReactElement {
	const t = useTranslation();

	return (
		<VideoConfPopup ref={ref}>
			<VideoConfPopupContent>
				<RoomAvatar room={room} size='x40' />
				<VideoConfPopupTitle text={t('Start_a_call')} />
			</VideoConfPopupContent>
			<VideoConfPopupFooter>
				<VideoConfPopupFooterButtons>
					<VideoConfButton disabled={loading} primary onClick={onConfirm}>
						{t('Start_call')}
					</VideoConfButton>
				</VideoConfPopupFooterButtons>
			</VideoConfPopupFooter>
		</VideoConfPopup>
	);
});

export default StartOmnichannelCallPopup;
