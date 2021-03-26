import { css } from '@rocket.chat/css-in-js';
import {
	Box,
	Icon,
	BoxProps,
	Button,
	ButtonProps,
	ButtonGroup,
	ButtonGroupProps,
} from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

type TitleProps = {
	title: string;
	icon: string | ReactNode;
};

const wordBreak = css`
	word-break: break-word;
`;

const InfoPanel: FC = ({ children }) => (
	<Box flexGrow={1} mb='neg-x24'>
		{children}
	</Box>
);

const Section: FC<BoxProps> = (props) => <Box mb='x24' {...props} />;

const Title: FC<TitleProps> = ({ title, icon }) => (
	<Box
		display='flex'
		title={title}
		flexShrink={0}
		alignItems='center'
		fontScale='s2'
		color='default'
		withTruncatedText
	>
		{typeof icon === 'string' ? <Icon name={icon} size='x22' /> : icon}
		<Box mis='x16' flexGrow={1} withTruncatedText>
			{title}
		</Box>
	</Box>
);

const Label: FC<BoxProps> = (props) => <Box mb='x8' fontScale='p2' color='default' {...props} />;

const Text: FC<BoxProps> = (props) => (
	<Box mb='x8' fontScale='p1' color='hint' withTruncatedText className={wordBreak} {...props} />
);

const Action: FC<ButtonProps & { icon: string; label: string }> = ({ label, icon, ...props }) => (
	<Button title={label} aria-label={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

const ActionGroup: FC<ButtonGroupProps> = (props) => (
	<Section>
		<ButtonGroup
			flexShrink={0}
			flexWrap='nowrap'
			withTruncatedText
			justifyContent='center'
			{...props}
		/>
	</Section>
);

const Field: FC = ({ children }) => <Box mb='x12'>{children}</Box>;

const Avatar: FC = ({ children }) => (
	<Section display='flex' justifyContent='center'>
		{children}
	</Section>
);

Object.assign(InfoPanel, {
	Title,
	Label,
	Text,
	Avatar,
	Field,
	Action,
	Section,
	ActionGroup,
});

export default InfoPanel;
