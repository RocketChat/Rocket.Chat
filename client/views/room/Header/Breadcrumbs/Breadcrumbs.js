import React from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { css } from '@rocket.chat/css-in-js';

const BreadcrumbsSeparator = () => <Box display='inline-flex' fontScale='s2' mi='x4' fontWeight='600' color='neutral-500'>/</Box>;
const BreadcrumbsIcon = ({ name }) => <Icon size='x20' name={name} />;

const BreadcrumbsLink = (props) => <BreadcrumbsText
	className={[
		css`
				&:hover,
				&:focus{
					color: ${ colors.b500 } !important;
				}
				&:visited{
					color: ${ colors.n800 };
				}
			`,
	].filter(Boolean)}
	is='a' {...props} />;

const BreadcrumbsText = (props) => <Box withTruncatedText is='span' color='default' {...props} />;

const BreadcrumbsItem = (props) => <Box width='100%' withTruncatedText display='inline-flex' flexDirection='row' alignItems='center' color='info' fontScale='s2' {...props} />;

export const Breadcrumbs = ({ children }) => 	<Box display='flex' flexDirection='row' alignItems='center' >{children}</Box>;

Object.assign(Breadcrumbs, {
	Text: BreadcrumbsText,
	Link: BreadcrumbsLink,
	Icon: BreadcrumbsIcon,
	Separator: BreadcrumbsSeparator,
	Item: BreadcrumbsItem,
});
