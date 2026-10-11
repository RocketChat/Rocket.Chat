import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { CallTimer } from '@rocket.chat/ui-client';

const callHeaderStyles = css`
	display: inline-flex;
	align-items: center;
	min-width: 0;
	color: ${Palette.text['font-pure-white'].toString()};
	font-variant-numeric: tabular-nums;
`;

export type CallTitleProps = {
	startAt?: Date;
	name?: string;
};

/** How long a call has been going, and what it is called. */
const CallTitle = ({ startAt, name }: CallTitleProps) => (
	<Box className={callHeaderStyles}>
		<CallTimer startAt={startAt} />
		{/* Drawn rather than typed: a typed rule is read out as "vertical line". */}
		{name && (
			<Box
				is='span'
				withTruncatedText
				marginInlineStart={8}
				paddingInlineStart={8}
				borderInlineStartWidth='default'
				borderInlineStartStyle='solid'
				borderInlineStartColor='stroke-extra-light'
			>
				{name}
			</Box>
		)}
	</Box>
);

export default CallTitle;
