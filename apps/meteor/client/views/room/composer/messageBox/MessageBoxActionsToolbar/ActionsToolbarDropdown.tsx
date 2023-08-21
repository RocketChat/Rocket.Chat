import type { IRoom } from '@rocket.chat/core-typings';
import { Dropdown, IconButton, Option, OptionTitle, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useTranslation, useUserRoom } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode } from 'react';
import React, { useRef, Fragment } from 'react';

import { messageBox } from '../../../../../../app/ui-utils/client';
import { useMessageboxAppsActionButtons } from '../../../../../hooks/useAppActionButtons';
import type { ChatAPI } from '../../../../../lib/chats/ChatAPI';
import { useDropdownVisibility } from '../../../../../sidebar/header/hooks/useDropdownVisibility';
import { useChat } from '../../../contexts/ChatContext';
import CreateDiscussionAction from './actions/CreateDiscussionAction';
import ShareLocationAction from './actions/ShareLocationAction';
import WebdavAction from './actions/WebdavAction';

type ActionsToolbarDropdownProps = {
	chatContext?: ChatAPI;
	rid: IRoom['_id'];
	isRecording?: boolean;
	tmid?: string;
	actions?: ReactNode[];
};

const ActionsToolbarDropdown = ({ isRecording, rid, tmid, actions, ...props }: ActionsToolbarDropdownProps) => {
	const chatContext = useChat();

	if (!chatContext) {
		throw new Error('useChat must be used within a ChatProvider');
	}

	const t = useTranslation();
	const reference = useRef(null);
	const target = useRef(null);

	const room = useUserRoom(rid);

	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	const apps = useMessageboxAppsActionButtons();

	const groups = {
		...(apps.isSuccess &&
			apps.data.length > 0 && {
				Apps: apps.data,
			}),
		...messageBox.actions.get(),
	};

	const messageBoxActions = Object.entries(groups).map(([name, group]) => {
		const items = group.map((item) => ({
			icon: item.icon,
			name: t(item.label),
			type: 'messagebox-action',
			id: item.id,
			action: item.action,
		}));

		return {
			title: t.has(name) && t(name),
			items,
		};
	});

	return (
		<>
			<IconButton
				data-qa-id='menu-more-actions'
				disabled={isRecording}
				small
				ref={reference}
				icon='plus'
				onClick={() => toggle()}
				{...props}
			/>
			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='bottom-start'>
					<OptionTitle>{t('Create_new')}</OptionTitle>
					{room && <CreateDiscussionAction room={room} />}
					{actions}
					<WebdavAction chatContext={chatContext} />
					{room && <ShareLocationAction room={room} tmid={tmid} />}
					{messageBoxActions?.map((actionGroup, index) => (
						<Fragment key={index}>
							<OptionTitle>{actionGroup.title}</OptionTitle>
							{actionGroup.items.map((item) => (
								<Option
									key={item.id}
									onClick={(event) =>
										item.action({
											rid,
											tmid,
											event: event as unknown as Event,
											chat: chatContext,
										})
									}
								>
									{item.icon && <OptionIcon name={item.icon as ComponentProps<typeof OptionIcon>['name']} />}
									<OptionContent>{item.name}</OptionContent>
								</Option>
							))}
						</Fragment>
					))}
				</Dropdown>
			)}
		</>
	);
};

export default ActionsToolbarDropdown;
