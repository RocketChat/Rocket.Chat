import type { IRoom } from '@rocket.chat/core-typings';
import { Dropdown, IconButton, Option, OptionTitle, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useRef } from 'react';

import { useDropdownVisibility } from '../../../../../sidebar/header/hooks/useDropdownVisibility';
import { useChat } from '../../../contexts/ChatContext';
import type { ToolbarAction } from './hooks/ToolbarAction';

type ActionsToolbarDropdownProps = {
	rid: IRoom['_id'];
	isRecording?: boolean;
	tmid?: string;
	actions: Array<ToolbarAction | string>;
};

const ActionsToolbarDropdown = ({ actions, isRecording, rid, tmid, ...props }: ActionsToolbarDropdownProps) => {
	const chatContext = useChat();

	if (!chatContext) {
		throw new Error('useChat must be used within a ChatProvider');
	}

	const t = useTranslation();
	const reference = useRef(null);
	const target = useRef(null);

	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

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
					{actions.map((option, index) => {
						if (typeof option === 'string') {
							if (index + 1 === actions.length) {
								return null;
							}
							return <OptionTitle key={option}>{t.has(option) ? t(option) : option}</OptionTitle>;
						}

						return (
							<Option
								key={option.id}
								onClick={(event) =>
									option.onClick({
										rid,
										tmid,
										event: event as unknown as Event,
										chat: chatContext,
									})
								}
								gap={!option.icon}
								disabled={option.disabled}
							>
								{option.icon && <OptionIcon name={option.icon as ComponentProps<typeof OptionIcon>['name']} />}
								<OptionContent>{option.label}</OptionContent>
							</Option>
						);
					})}
				</Dropdown>
			)}
		</>
	);
};

export default ActionsToolbarDropdown;
