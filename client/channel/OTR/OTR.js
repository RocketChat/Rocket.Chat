import React, { useState, useEffect, useMemo } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useSetModal } from '../../contexts/ModalContext';
import OTR from '../../components/OTR/OTR';
import OTRModal from '../../components/OTR/OTRModal';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { OTR as ORTInstance } from '../../../app/otr/client/rocketchat.otr';

export default ({
	rid,
	tabBar,
}) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const [isOnline, setIsOnline] = useState(false);
	const [isEstablishing, setIsEstablishing] = useState(false);
	const [isEstablished, setIsEstablished] = useState(false);

	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const otr = rid && ORTInstance.getInstanceByRoomId(rid);
	const { data } = useEndpointDataExperimental('users.getStatus', useMemo(() => ({ userId: otr.peerId }), [otr.peerId]));

	const handleStart = () => {
		otr.handshake();
		setIsEstablishing(true);

		otr.timeout = setTimeout(() => {
			setTimeout(() => {
				!otr.established.get() && setModal(<OTRModal onConfirm={closeModal} onCancel={closeModal} />);
			}, 200);
			setIsEstablishing(false);
		}, 10000);
	};

	const handleEnd = () => {
		if (otr) {
			otr.end();
			setIsEstablished(false);
		}
	};

	const handleReset = () => {
		otr.reset();
		otr.handshake(true);
		setIsEstablishing(true);

		otr.timeout = setTimeout(() => {
			setTimeout(() => {
				!otr.established.get() && setModal(<OTRModal onConfirm={closeModal} onCancel={closeModal} />);
			}, 200);
			setIsEstablishing(false);
		}, 10000);
	};

	useEffect(() => {
		setIsOnline(data && data.status !== 'offline');
		setIsEstablished(otr.established.get());
	}, [data, otr, isEstablishing, isEstablished, isOnline]);

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
