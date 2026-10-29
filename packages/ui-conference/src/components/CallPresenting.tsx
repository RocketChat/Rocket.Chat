import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Icon, Palette, borderRadius } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type Presenter = {
	name: string;
	avatarUrl?: string;
	isLocal?: boolean;
};

const pillStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.25rem 0.75rem;
	border: none;
	border-radius: ${borderRadius('full')};
	background-color: ${Palette.surface['surface-light'].toString()};
	color: ${Palette.text['font-titles-labels'].toString()};
	min-width: 0;
	white-space: nowrap;
`;

const stopButtonStyles = css`
	flex-shrink: 0;
	padding: 0.125rem 0.5rem;
	border: none;
	border-radius: ${borderRadius('full')};
	/* Palette carries no button colours: these are the tokens fuselage's danger button is drawn with. */
	background-color: var(--rcx-color-button-background-danger-default);
	color: var(--rcx-color-button-font-on-danger);
	cursor: pointer;

	&:hover {
		background-color: var(--rcx-color-button-background-danger-hover);
	}
`;

type CallPresentingProps = {
	presenters: Presenter[];
	onStopPresenting?: () => void;
};

const CallPresenting = ({ presenters, onStopPresenting }: CallPresentingProps) => {
	const { t } = useTranslation();

	if (!presenters.length) {
		return null;
	}

	const [first, ...rest] = presenters;
	const label = first.isLocal ? t('__name__you_presenting', { name: first.name }) : t('__name__presenting', { name: first.name });

	return (
		<Box className={pillStyles} fontScale='c1' title={label}>
			{!first.isLocal && first.avatarUrl ? (
				<Avatar url={first.avatarUrl} size='x16' />
			) : (
				<Icon name={first.isLocal ? 'desktop' : 'user'} size='x16' />
			)}
			<Box is='span' withTruncatedText>
				{label}
			</Box>
			{rest.length > 0 && (
				<Box is='span' flexShrink={0}>
					+{rest.length}
				</Box>
			)}
			{first.isLocal && onStopPresenting && (
				<Box is='button' type='button' className={stopButtonStyles} fontScale='c2' onClick={onStopPresenting}>
					{t('Stop_presenting')}
				</Box>
			)}
		</Box>
	);
};

export default CallPresenting;
