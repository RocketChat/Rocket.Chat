import type { IMessage } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useUserId, useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useState, useEffect } from 'react';

type ImportantMessageReadButtonProps = {
	message: IMessage;
};

const ImportantMessageReadButton = ({ message }: ImportantMessageReadButtonProps): ReactElement | null => {
	const userId = useUserId();
	const toggleImportantMessageRead = useMethod('toggleImportantMessageRead');
	const dispatchToastMessage = useToastMessageDispatch();
	
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
		} catch (error) {
			setIsRead(!newState);
			dispatchToastMessage({
				type: 'error',
				message: error instanceof Error ? error.message : String(error),
			});
		}
	};

	return (
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
	);
};

export default memo(ImportantMessageReadButton);
