import { Box, Divider } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useId } from 'react';

type RoomSectionProps = {
	avatar?: ReactNode;
	title: ReactNode;
	action: ReactNode;
	children: ReactNode;
};

const RoomSection = ({ avatar, title, action, children }: RoomSectionProps) => {
	const headingId = useId();

	return (
		<Box is='section' aria-labelledby={headingId} marginBlockEnd={24}>
			<Box display='flex' alignItems='center' justifyContent='space-between' paddingBlock={8} paddingInline={24}>
				<Box display='flex' alignItems='center' gap={8} minWidth={0}>
					{avatar}
					<Box is='h3' id={headingId} fontScale='h4' color='default' withTruncatedText>
						{title}
					</Box>
				</Box>
				{action}
			</Box>
			<Box marginInline={24}>
				<Divider flush />
			</Box>
			{children}
		</Box>
	);
};

export default RoomSection;
