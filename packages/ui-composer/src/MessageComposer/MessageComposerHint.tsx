import type { IconProps } from '@rocket.chat/fuselage';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

type MessageComposerHintProps = {
	children: string;
	icon?: IconProps['name'];
	helperText?: ReactNode;
};

const MessageComposerHint = ({ icon, children, helperText }: MessageComposerHintProps): ReactElement => (
	<Box pbs={0} pbe={4} display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
		<Tag icon={icon ? <Icon mie={4} name={icon} size='x12' /> : undefined}>{children}</Tag>
		{helperText && (
			<Box fontScale='c1' color='font-hint'>
				{helperText}
			</Box>
		)}
	</Box>
);
export default MessageComposerHint;
