import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useMemo, useCallback } from 'react';

import { OtrRoomState } from '../../../../../app/otr/client/OtrRoomState';
import { OTR as ORTInstance } from '../../../../../app/otr/client/rocketchat.otr';
import { useSetModal } from '../../../../contexts/ModalContext';
import { usePresence } from '../../../../hooks/usePresence';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import OTR from './OTR';
import OTRModal from './OTRModal';

const OTRWithData = ({ rid, tabBar }) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());

	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const otr = useMemo(() => ORTInstance.getInstanceByRoomId(rid), [rid]);

	const [isEstablished, isEstablishing] = useReactiveValue(
		useCallback(
			() => (otr ? [otr.state.get() === OtrRoomState.ESTABLISHED, otr.state.get() === OtrRoomState.ESTABLISHING] : [false, false]),
			[otr],
		),
	);

	const userStatus = usePresence(otr.peerId)?.status;

	const isOnline = !['offline', 'loading'].includes(userStatus);

	const handleStart = () => {
		otr.handshake();
	};

	const handleEnd = () => otr?.end();

	const handleReset = () => {
		otr.reset();
		otr.handshake(true);
	};

	useEffect(() => {
		if (isEstablished) {
			return closeModal();
		}

		if (!isEstablishing) {
			return;
		}

		const timeout = setTimeout(() => {
			// otr.establishing.set(false);
			otr.state.set(OtrRoomState.TIMEOUT);
			setModal(<OTRModal onConfirm={closeModal} onCancel={closeModal} />);
		}, 10000);

		return () => clearTimeout(timeout);
	}, [closeModal, isEstablished, isEstablishing, setModal, otr]);

	return (
		<OTR
			isOnline={isOnline}
			isEstablishing={isEstablishing}
			isEstablished={isEstablished}
			onClickClose={onClickClose}
			onClickStart={handleStart}
			onClickEnd={handleEnd}
			onClickRefresh={handleReset}
		/>
	);
};

export default OTRWithData;
