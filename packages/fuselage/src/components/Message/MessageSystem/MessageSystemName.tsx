import { styled, Text } from '@tamagui/web';

import { cx } from '../../../helpers/composeClassNames';
import type { MessageNameProps } from '../MessageName';

export type MessageSystemNameProps = MessageNameProps;

const SystemNameFrame = styled(Text, { render: 'span' });

const MessageSystemName = ({ className, children, ...props }: MessageSystemNameProps) => (
	<SystemNameFrame className={cx('rcx-message-system__name', className)} render={<span {...props} />}>
		{children}
	</SystemNameFrame>
);

export default MessageSystemName;
