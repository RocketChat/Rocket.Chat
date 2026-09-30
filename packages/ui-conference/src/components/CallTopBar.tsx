import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { CallTimer } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const headerStyles = css`
	display: inline-flex;
	align-items: center;
	min-width: 0;
	color: rgba(255, 255, 255, 0.85);
	font-variant-numeric: tabular-nums;
`;

/** What the bar is at least, which is what anything laid over the window has to start below. */
export const CALL_TOP_BAR_MIN_HEIGHT = 48;

type CallTopBarProps = {
	/** When the call started, which is what the bar counts from. */
	startAt?: Date;
	/** What the call is called, if it has been given a name. */
	name?: string;
	/**
	 * The call's own header, in place of the one built from `startAt` and `name` — for a call that runs in here and
	 * draws one, which nothing built from the call's facts would match.
	 */
	host?: ReactNode;
	/** This window's own actions about the call, at the inline end. */
	children: ReactNode;
};

/**
 * The conference window's top bar, spanning the whole window above the call and its side panels — what it says
 * is about the call, not about the slice of the window the call happens to occupy.
 */
const CallTopBar = ({ startAt, name, host, children }: CallTopBarProps) => {
	const { t } = useTranslation();

	return (
		<Box
			is='header'
			// Named: a header is a landmark, and a modal in this window brings a second one.
			aria-label={t('Call')}
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			flexShrink={0}
			width='100%'
			minHeight={CALL_TOP_BAR_MIN_HEIGHT}
			paddingInline={12}
			gap={8}
		>
			{host ?? (
				<Box className={headerStyles}>
					<CallTimer startAt={startAt} />
					{/* The rule between the clock and the name is drawn, not typed. As a character it was content — read
				    out as "vertical line" by anything reading the header — and styled by nudging its opacity until it
				    looked like a rule. */}
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
			)}
			{/* `ButtonGroup` has no `gap` prop — only `align`, `stretch`, `wrap`, `vertical`, `small` and `large` —
			    so this one stays a style. */}
			<ButtonGroup style={{ gap: 8 }}>{children}</ButtonGroup>
		</Box>
	);
};

export default CallTopBar;
