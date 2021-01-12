import React, { FC } from 'react';
import { ActionButton, Box, BoxProps, Button, ButtonProps, Icon } from '@rocket.chat/fuselage';

export const Content: FC<BoxProps> = (props) => <Box display='flex' mb='x4' mi='neg-x4' {...props} />;
const ContentItem: FC = (props) => <Box display='flex' mb='x4' mi='x4' {...props} />;

export const Reply: FC<ButtonProps> = (props) => <ContentItem><Button {...props} small primary/></ContentItem>;

type IconProps = { name: 'thread' | 'user' | 'clock' | 'discussion' };
type FollowingProps = { name: 'bell' | 'bell-off' };

const MetricsItemIcon: FC<IconProps> = (props) => <Icon size='x20' {...props} />;
const MetricsItemLabel: FC<BoxProps> = (props) => <Box mis='x4'{...props} />;
const MetricsItem: FC<BoxProps> & { Icon: FC<IconProps>; Label: FC<BoxProps> } = (props) => <Box display='flex' justifyContent='center' alignItems='center' fontScale='micro' color='info' mi='x4'{...props} />;
const Metrics: FC<BoxProps> & { Item: FC<BoxProps> & { Icon: FC<IconProps>; Label: FC<BoxProps> }; Following: FC<FollowingProps> } = (props) => <ContentItem><Box display='flex' mi='neg-x4' {...props} /></ContentItem>;
const MetricsFollowing: FC<FollowingProps> = ({ name }) => <ActionButton color='info' small ghost icon={name} />;

Metrics.Item = MetricsItem;
Metrics.Following = MetricsFollowing;

MetricsItem.Label = MetricsItemLabel;
MetricsItem.Icon = MetricsItemIcon;

export default Metrics;
