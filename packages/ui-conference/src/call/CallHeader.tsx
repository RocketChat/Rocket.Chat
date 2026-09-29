import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { CallTimer } from '@rocket.chat/ui-client';

import { useCallState } from './context';

const callHeaderStyles = css`
	display: inline-flex;
	align-items: center;
	min-width: 0;
	color: ${Palette.text['font-pure-white'].toString()};
	font-variant-numeric: tabular-nums;
`;

export type CallHeaderProps = {
	name?: string;
};

/** How long the call running in this window has been going, and what it is called. */
const CallHeader = ({ name }: CallHeaderProps) => {
	const { startedAt } = useCallState();

	return (
		<Box className={callHeaderStyles}>
			<CallTimer startAt={startedAt} />
			{name && (
				<>
					<Box is='span' color='default' opacity={0.5} marginInline={8}>
						|
					</Box>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
				</>
			)}
		</Box>
	);
};

export default CallHeader;
