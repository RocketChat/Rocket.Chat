import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type Presenter = {
	name: string;
	avatarUrl?: string;
	isLocal?: boolean;
};

const pillStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border: none;
	border-radius: 16px;
	background-color: rgba(255, 255, 255, 0.15);
	color: #fff;
	font-size: 12px;
	line-height: 16px;
	font-weight: 500;
	white-space: nowrap;
`;

const stopButtonStyles = css`
	flex-shrink: 0;
	padding: 2px 8px;
	border: none;
	border-radius: 12px;
	background-color: rgb(187 57 51);
	color: #fff;
	font-size: 11px;
	line-height: 16px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background-color: rgb(213 67 60);
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
		<Box className={pillStyles} title={label}>
			{first.isLocal ? <Icon name='desktop' size='x16' /> : <Avatar url={first.avatarUrl || ''} size='x16' />}
			<Box is='span'>{label}</Box>
			{rest.length > 0 && (
				<Box is='span' flexShrink={0}>
					+{rest.length}
				</Box>
			)}
			{first.isLocal && onStopPresenting && (
				<Box is='button' type='button' className={stopButtonStyles} onClick={onStopPresenting}>
					{t('Stop_presenting')}
				</Box>
			)}
		</Box>
	);
};

export default CallPresenting;
