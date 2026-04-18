import type { IMessage } from '@rocket.chat/core-typings';
import { Button, Box } from '@rocket.chat/fuselage';
import { useUserId, useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { memo, useState, useEffect } from 'react';

import ImportantMessageReadInfo from './ImportantMessageReadInfo';

type ImportantMessageReadButtonProps = {
	message: IMessage;
};

const ImportantMessageReadButton = ({ message }: ImportantMessageReadButtonProps): ReactElement | null => {
	const userId = useUserId();
	const toggleImportantMessageRead = useMethod('toggleImportantMessageRead');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	
	const serverIsRead = message.importantReadBy?.includes(userId || '') ?? false;
	const [isRead, setIsRead] = useState(serverIsRead);

	useEffect(() => {
		setIsRead(serverIsRead);
	}, [serverIsRead]);

	if (!message.isImportant || !userId) {
		return null;
	}

	const handleToggle = async () => {
		const newState = !isRead;
		setIsRead(newState);
		
		try {
			await toggleImportantMessageRead(message._id);
			queryClient.invalidateQueries({ 
				queryKey: ['important-message-readers', message._id] 
			});
		} catch (error) {
			setIsRead(!newState);
			dispatchToastMessage({
				type: 'error',
				message: error instanceof Error ? error.message : String(error),
			});
		}
	};

	return (
		<Box display='flex' alignItems='center'>
			<Button
				small
				onClick={handleToggle}
				primary={!isRead}
				success={isRead}
				mis='x8'
				mbs='x4'
				style={{ width: 'fit-content', minWidth: 'auto' }}
			>
				{isRead ? 'Message read' : 'Mark as read'}
			</Button>
			<ImportantMessageReadInfo message={message} />
		</Box>
	);
};

export default memo(ImportantMessageReadButton);
