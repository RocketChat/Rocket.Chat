import React from 'react';
import { Box, Divider } from '@rocket.chat/fuselage';

export const DOUBLE_COLUMN_CARD_WIDTH = 552;

const Title = ({ children }) => <Box mb='x8' fontScale='p2'>{children}</Box>;

const Footer = ({ children }) => <Box mb='x8'>{children}</Box>;

const Body = ({ children, flexDirection = 'row' }) => <Box mb='x8' display='flex' flexDirection={flexDirection} flexGrow={1}>{children}</Box>;

const Col = ({ children }) => <Box display='flex' alignSelf='stretch' w='x228' flexDirection='column' fontScale='c1'>{children}</Box>;

const ColSection = ({ children }) => <Box mb='x8' color='info'>{children}</Box>;

const ColTitle = ({ children }) => <Box fontScale='c2' m='none'>{children}</Box>;

const CardDivider = () => <Divider width='x1' mi='x24' mb='none' alignSelf='stretch'/>;

const Card = ({ children, ...props }) => <Box display='flex' flexDirection='column' pi='x16' pb='x8' width='fit-content' bg='neutral-100' {...props}>{children}</Box>;

Object.assign(Col, {
	Title: ColTitle,
	Section: ColSection,
});

Object.assign(Card, {
	Title,
	Body,
	Col,
	Footer,
	Divider: CardDivider,
});

export default Card;
