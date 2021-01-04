import React, { FC } from 'react';
import { Box, Button, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';


export const Content: FC = (props) => <Box display='flex' mb='x4' mi='neg-x4' {...props} />;
const ContentItem: FC = (props) => <Box display='flex' mb='x4' mi='x4' {...props} />;

export const Reply: FC = (props) => {
	const t = useTranslation();
	return <ContentItem><Button {...props} small primary>{t('Reply')}</Button></ContentItem>;
};

const Metrics: FC = (props) => <ContentItem><Box display='flex' mi='neg-x4' {...props} /></ContentItem>;
const MetricsItem: FC = (props) => <Box display='flex' justifyContent='center' alignItems='center' fontScale='micro' color='info' mi='x4'{...props} />;
const MetricsItemIcon: FC <{ name: 'thread' | 'user' | 'bell' | 'clock' | 'discussion' }> = (props) => <Icon size='x24' {...props} />;
const MetricsItemLabel: FC = (props) => <Box mis='x4'{...props} />;


export default Metrics;

Object.assign(Metrics, {
	Item: MetricsItem,
});

Object.assign(MetricsItem, {
	Icon: MetricsItemIcon,
	Label: MetricsItemLabel,
});
