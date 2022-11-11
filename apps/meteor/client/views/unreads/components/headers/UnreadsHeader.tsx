import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import HeaderMenu from './HeaderMenu';

type UnreadsHeaderProps = {
	totalMessages: number;
	totalRooms: number;
	handleMarkAll: any;
};

const UnreadsHeader: FC<UnreadsHeaderProps> = ({ totalMessages, totalRooms, handleMarkAll }) => {
	const t = useTranslation();
	const { isMobile } = useLayout();

	return (
		<Header>
			<Header.Content.Row flexDirection='row' justifyContent={'flex-start'}>
				<Box flexDirection='column' justifyContent={'flex-start'}>
					<Header.Title is='h1'>{`${totalMessages} ${t('Unread_Messages')}`}</Header.Title>
					<Header.Subtitle is='h2' padding={'0px 5px'}>
						<MarkdownText
							parseEmoji={true}
							variant='inlineWithoutBreaks'
							withTruncatedText
							content={`${totalRooms} ${totalRooms === 1 ? t('Room') : t('Rooms')}`}
						/>
					</Header.Subtitle>
				</Box>
			</Header.Content.Row>
			<Header.Content.Row flexDirection='row' justifyContent={'flex-end'}>
				<ButtonGroup>
					{!isMobile && (
						<Button onClick={handleMarkAll}>
							<Icon name={'flag'} size='x20' margin='4x' />
							<span style={{ marginLeft: '10px' }}>{t('Mark_all_as_read_short')}</span>
						</Button>
					)}
					<HeaderMenu />
				</ButtonGroup>
			</Header.Content.Row>
		</Header>
	);
};
export default memo(UnreadsHeader);
