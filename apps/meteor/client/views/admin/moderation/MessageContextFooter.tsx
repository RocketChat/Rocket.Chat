import { Button, Icon, Menu, Option, Flex } from '@rocket.chat/fuselage';
import React from 'react';
import type { FC } from 'react';

import useDeactivateUserAction from './hooks/useDeactivateUserAction';
import useDeleteMessagesAction from './hooks/useDeleteMessagesAction';
import useDismissUserAction from './hooks/useDismissUserAction';
import useResetAvatarAction from './hooks/useResetAvatarAction';

const MessageContextFooter: FC<{ userId: string; onChange: () => void; onReload: () => void }> = ({ userId, onChange, onReload }) => {
	const { action } = useDeleteMessagesAction(userId, onChange, onReload);

	return (
		<Flex.Container inline direction='row' alignItems='center' justifyContent='center'>
			<Flex.Item grow={1}>
				<Button size={37} onClick={action} title='Delete all messages' aria-label='Delete all messages' danger>
					<Icon name='trash' /> Delete all messages
				</Button>
			</Flex.Item>
			<Flex.Item>
				<Menu
					options={{
						approve: useDismissUserAction(userId, onChange, onReload),
						deactivate: useDeactivateUserAction(userId, onChange, onReload),
						resetAvatar: useResetAvatarAction(userId, onChange, onReload),
					}}
					size={37}
					renderItem={({ label: { label, icon }, ...props }): JSX.Element => (
						<Option aria-label={label} label={label} icon={icon} {...props} />
					)}
				/>
			</Flex.Item>
		</Flex.Container>
	);
};

export default MessageContextFooter;
