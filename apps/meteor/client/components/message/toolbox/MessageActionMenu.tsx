import { MessageToolboxItem, Option, OptionDivider, Box, OptionTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, UIEvent, ReactElement } from 'react';
import React, { useState, Fragment, useRef } from 'react';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import { useHandleMenuAction } from '../../../hooks/useHandleMenuAction';
import GenericMenu from '../../GenericMenu';
import type { GenericMenuItemProps } from '../../GenericMenuItem';
import ToolboxDropdown from './ToolboxDropdown';
import { useMessageActionMenu } from './actions/hooks/useMessageActionMenu';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order' | 'action'> & {
	action: (event: UIEvent) => void;
};

type MessageActionMenuProps = {
	options: MessageActionConfigOption[];
};

const MessageActionMenu = ({ options, ...props }: MessageActionMenuProps): ReactElement => {
	const ref = useRef(null);

	const t = useTranslation();
	const [visible, setVisible] = useState(false);
	const isLayoutEmbedded = useEmbeddedLayout();

	// const groupOptions = options
	// 	.map(({ type, color, ...option }) => ({
	// 		...option,
	// 		...(type && { type }),
	// 		...(color === 'alert' && { variant: 'danger' as const }),
	// 	}))
	// 	.reduce((acc, option) => {
	// 		const type = option.type ? option.type : '';
	// 		acc[type] = acc[type] || [];
	// 		if (!(isLayoutEmbedded && option.id === 'reply-directly')) acc[type].push(option);

	// 		if (acc[type].length === 0) delete acc[type];

	// const sections = useMessageActionMenu();
	// const items = sections.reduce((acc, { items }) => [...acc, ...items], [] as GenericMenuItemProps[]);

	// const handleAction = useHandleMenuAction(items);

	// return (
	// 	<GenericMenu
	// 		placement='bottom-end'
	// 		icon='kebab'
	// 		sections={sections}
	// 		onAction={handleAction}
	// 		title={t('More')}
	// 		// is={Sidebar.TopBar.Action}
	// 		{...props}
	// 	/>
	// );

	// return (
	// 	<>
	// 		<MessageToolboxItem
	// 			ref={ref}
	// 			icon='kebab'
	// 			onClick={(): void => setVisible(!visible)}
	// 			data-qa-id='menu'
	// 			data-qa-type='message-action-menu'
	// 			title={t('More')}
	// 		/>
	// 		{visible && (
	// 			<>
	// 				<Box position='fixed' inset={0} onClick={(): void => setVisible(!visible)} />
	// 				<ToolboxDropdown reference={ref} {...props}>
	// 					{Object.entries(groupOptions).map(([, options], index, arr) => (
	// 						<Fragment key={index}>
	// 							{options[0].type === 'apps' && <OptionTitle>Apps</OptionTitle>}
	// 							{options.map((option) => (
	// 								<Option
	// 									variant={option.variant}
	// 									key={option.id}
	// 									id={option.id}
	// 									icon={option.icon as ComponentProps<typeof Option>['icon']}
	// 									label={t(option.label)}
	// 									onClick={option.action}
	// 									data-qa-type='message-action'
	// 									data-qa-id={option.id}
	// 									role={option.role ? option.role : 'button'}
	// 								/>
	// 							))}
	// 							{index !== arr.length - 1 && <OptionDivider />}
	// 						</Fragment>
	// 					))}
	// 				</ToolboxDropdown>
	// 			</>
	// 		)}
	// 	</>
	// );
};

export default MessageActionMenu;
