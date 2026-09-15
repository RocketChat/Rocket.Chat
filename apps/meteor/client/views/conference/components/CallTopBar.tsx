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

type CallTopBarProps = {
	/** When the call started, which is what the bar counts from. */
	startAt?: Date;
	/** What the call is called, if it has been given a name. */
	name?: string;
	/** This window's own actions about the call, at the inline end. */
	children: ReactNode;
};

/**
 * The conference window's top bar, spanning the whole window above the call and its side panels.
 *
 * It sits up here rather than inside the call area because what it says is about the call, not about the slice
 * of the window the call happens to occupy: put in the call area it stopped at the panel's edge and shifted
 * every time a panel opened. Fixed above them, the panels hang beneath it.
 *
 * What it says about the call, it builds. It used to take that as a `host` node, which meant the one page that
 * renders it also had to know how a call header is laid out — and that page has enough to do.
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
			minHeight={48}
			paddingInline={12}
			gap={8}
		>
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
			{/* `ButtonGroup` has no `gap` prop — only `align`, `stretch`, `wrap`, `vertical`, `small` and `large` —
			    so this one stays a style. */}
			<ButtonGroup style={{ gap: 8 }}>{children}</ButtonGroup>
		</Box>
	);
};

export default CallTopBar;
