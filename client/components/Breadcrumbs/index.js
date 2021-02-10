import React from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { css } from '@rocket.chat/css-in-js';

const BreadcrumbsSeparator = () => <Box display='inline-block' fontScale='s2' mi='x4' fontWeight='600' color='neutral-500'>/</Box>;
const BreadcrumbsIcon = ({ name, color, children }) => <Box w='x20' mi='x2' display='inline-flex' justifyContent='center' color={color}>{name ? <Icon size='x20' name={name}/> : children}</Box>;

const BreadcrumbsLink = (props) => <BreadcrumbsText
	is='a'
	{...props}
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
/>;

const BreadcrumbsText = (props) => <Box display='inline' is='span' mi='x2' color='default' {...props} />;

const BreadcrumbsItem = (props) => <Box mi='neg-x2' display='inline-flex' flexDirection='row' alignItems='center' color='info' fontScale='s2' {...props} />;

const Breadcrumbs = ({ children }) => <Box withTruncatedText mie='x2' display='flex' flexDirection='row' alignItems='center'>{children}</Box>;

Object.assign(Breadcrumbs, {
	Text: BreadcrumbsText,
	Link: BreadcrumbsLink,
	Icon: BreadcrumbsIcon,
	Separator: BreadcrumbsSeparator,
	Item: BreadcrumbsItem,
});

export default Breadcrumbs;
