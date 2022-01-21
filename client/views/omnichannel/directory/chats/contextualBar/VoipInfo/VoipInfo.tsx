import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { IUser } from '../../../../../../../definition/IUser';
import { UserStatus } from '../../../../../../components/UserStatus';
import VerticalBar from '../../../../../../components/VerticalBar';
import UserAvatar from '../../../../../../components/avatar/UserAvatar';
import { useTranslation } from '../../../../../../contexts/TranslationContext';
import { InfoField } from './InfoField';

type VoipInfoPropsType = {
	contact: any;
	user: IUser | null;
	onClickClose: () => void;
	onClickReport: () => void;
	onClickCall: () => void;
};

export const VoipInfo = ({ contact, user, onClickClose, onClickReport, onClickCall }: VoipInfoPropsType): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='phone' />
				<VerticalBar.Text>{'Call Information'}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClickClose} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<InfoField label={t('Contact')} info={contact.name} />
				<InfoField label={t('Phone_Number')} info={contact.name} />
				<InfoField label={t('Queue')} info={contact.name} />
				<InfoField label={t('Last_Call')} info={contact.name} />
				<InfoField label={t('Waiting_Time')} info={contact.name} />
				<InfoField label={t('Talk_Time')} info={contact.name} />
				<InfoField label={t('Hold_Time')} info={contact.name} />

				<Box fontScale='p2' mb='14px'>
					<Box mbe='8px'>{t('Agent')}</Box>
					{user && (
						<Box display='flex' alignItems='center'>
							<UserAvatar size='x40' username={user.username || ''} etag={user.avatarETag} />
							<Box mi='8px'>
								<UserStatus status={user.status} />
							</Box>
							<Box fontScale='p2' mie='4px'>
								{user.username}
							</Box>
							<Box fontScale='p2' color='hint'>
								{user.name}
							</Box>
						</Box>
					)}
				</Box>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button danger onClick={onClickReport}>
						<Box display='flex' justifyContent='center' fontSize='p2'>
							<Icon name='ban' size='x20' mie='4px' />
							{t('Report_Number')}
						</Box>
					</Button>
					<Button onClick={onClickCall}>
						<Box display='flex' justifyContent='center' fontSize='p2'>
							<Icon name='phone' size='x20' mie='4px' />
							{t('Call')}
						</Box>
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};
