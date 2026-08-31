import type { IconProps } from '@rocket.chat/fuselage';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type MessageComposerHintProps = {
	children: string;
	icon?: IconProps['name'];
	helperText?: ReactNode;
};

const MessageComposerHint = ({ icon, children, helperText }: MessageComposerHintProps) => (
	<Box paddingBlockStart={0} paddingBlockEnd={4} display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
		<Tag icon={icon ? <Icon marginInlineEnd={4} name={icon} size='x12' /> : undefined}>{children}</Tag>
		{helperText && (
			<Box fontScale='c1' color='hint'>
				{helperText}
			</Box>
		)}
	</Box>
);
export default MessageComposerHint;
