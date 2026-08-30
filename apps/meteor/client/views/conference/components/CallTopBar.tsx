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
	 * A header of someone else's, in place of the one built from `startAt` and `name`.
	 *
	 * Only for a provider that renders the call in here and brings its own: there is a real header to mount, and
	 * nothing this window could build from the call would be as good as the one the call is already drawing.
	 */
	host?: ReactNode;
	/** This window's own actions about the call, at the inline end. */
	children: ReactNode;
};

/**
 * The conference window's top bar, spanning the whole window above the call *and* its side panels — the mirror
 * of the bottom bar below them.
 *
 * It exists because a call that runs inside Rocket.Chat has a header of its own, and that header is about the
 * call rather than about the slice of the window the call happens to occupy: put inside the call area it stopped
 * at the panel's edge and shifted every time a panel opened. Up here it is fixed, and the panels hang beneath
 * it — which is also where every other conferencing product puts it.
 *
 * What it says about the call, it builds. It used to take that as a `host` node, which meant the one page that
 * renders it also had to know how a call header is laid out — and that page has enough to do.
 *
 * Only a provider that renders in here has a header to give: one handed off to an iframe keeps its own chrome
 * inside that frame, so this bar isn't rendered at all for those.
 */
const CallTopBar = ({ startAt, name, children }: CallTopBarProps) => {
	const { t } = useTranslation();

	return (
		<Box
			is='header'
			// Named, because a header is a landmark and this window can hold a second one: a modal brings a header
			// of its own, and two unnamed banners in a page are two things neither a person nor a test can tell
			// apart.
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
