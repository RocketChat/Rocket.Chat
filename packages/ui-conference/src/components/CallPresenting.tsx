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
	const qualifier = first.isLocal ? t('You_presenting') : t('Presenting');
	const label = `${first.name} (${qualifier})`;

	return (
		<Box className={pillStyles} fontScale='c1' title={label}>
			{first.isLocal ? <Icon name='desktop' size='x16' /> : <Avatar url={first.avatarUrl || ''} size='x16' />}
			<Box is='span'>{label}</Box>
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
