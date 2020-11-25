import React from 'react';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../basic/VerticalBar';

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
				{isEstablishing && isOnline && <Box fontScale='p1'>{t('Please_wait_while_OTR_is_being_established')}</Box>}
				{isEstablished && isOnline && <ButtonGroup stretch>
					{onClickRefresh && <Button width='50%' onClick={onClickRefresh}>{t('Refresh_keys')}</Button>}
					{onClickEnd && <Button width='50%' danger onClick={onClickEnd}>{t('End_OTR')}</Button>}
				</ButtonGroup>}

				{!isOnline && <Box fontScale='p2'>{t('OTR_is_only_available_when_both_users_are_online')}</Box>}
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default OTR;
