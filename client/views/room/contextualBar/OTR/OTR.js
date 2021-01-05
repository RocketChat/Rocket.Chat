import React, { useEffect, useMemo, useCallback } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Box, Button, ButtonGroup, Throbber } from '@rocket.chat/fuselage';

import { useSetModal } from '../../../../contexts/ModalContext';
import OTRModal from './OTRModal';
import { OTR as ORTInstance } from '../../../../../app/otr/client/rocketchat.otr';
import { useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/VerticalBar';
import { usePresence } from '../../../../components/UserStatus';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const OTR = ({
	isEstablishing,
	isEstablished,
	isOnline,
	onClickClose,
	onClickStart,
	onClickEnd,
	onClickRefresh,
}) => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='key'/>
				<VerticalBar.Text>{t('OTR')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24'>
				<Box fontScale='s2'>{t('Off_the_record_conversation')}</Box>

				{!isEstablishing && !isEstablished && isOnline && <Button onClick={onClickStart} primary>{t('Start_OTR')}</Button>}
				{isEstablishing && !isEstablished && isOnline && <> <Box fontScale='p1'>{t('Please_wait_while_OTR_is_being_established')}</Box> <Throbber inheritColor/> </>}
				{isEstablished && isOnline && <ButtonGroup stretch>
					{onClickRefresh && <Button width='50%' onClick={onClickRefresh}>{t('Refresh_keys')}</Button>}
					{onClickEnd && <Button width='50%' danger onClick={onClickEnd}>{t('End_OTR')}</Button>}
				</ButtonGroup>}

				{!isOnline && <Box fontScale='p2'>{t('OTR_is_only_available_when_both_users_are_online')}</Box>}
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default ({
	rid,
	tabBar,
}) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());

	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const otr = useMemo(() => ORTInstance.getInstanceByRoomId(rid), [rid]);

	const [isEstablished, isEstablishing] = useReactiveValue(useCallback(() => (otr ? [otr.established.get(), otr.establishing.get()] : [false, false]), [otr]));

	const userStatus = usePresence(otr.peerId);

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
			setModal(<OTRModal onConfirm={closeModal} onCancel={closeModal} />);
		}, 10000);

		return () => clearTimeout(timeout);
	}, [closeModal, isEstablished, isEstablishing, setModal]);

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
