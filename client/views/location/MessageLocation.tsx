import React, { FC, useMemo } from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';

import { IMessage } from '../../../definition/IMessage';
import ExternalLink from '../../components/ExternalLink';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useAsyncImage } from './useAsyncImage';

type MessageLocationProps = {
	message: IMessage;
};

const MessageLocation: FC<MessageLocationProps> = ({ message }) => {
	const [longitude, latitude] = message.location?.coordinates ?? [];
	const googleMapsApiKey = useSetting('MapView_GMapsAPIKey') as string;

	const linkUrl = useMemo(() => {
		if (!latitude || !longitude) {
			return undefined;
		}

		return `https://maps.google.com/maps?daddr=${ latitude },${ longitude }`;
	}, [latitude, longitude]);

	const imageUrl = useAsyncImage(
		useMemo(() => {
			if (!latitude || !longitude || !googleMapsApiKey) {
				return undefined;
			}

			return `https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=250x250&markers=color:gray%7Clabel:%7C${ latitude },${ longitude }&key=${ googleMapsApiKey }`;
		}, [googleMapsApiKey, latitude, longitude]),
	);

	const t = useTranslation();

	if (!linkUrl) {
		return null;
	}

	if (!imageUrl) {
		return <Box is='span' fontScale='p1' display='inline-flex' alignItems='center' paddingBlock={4}>
			<Icon name='map-pin' size={20} color='hint' />
			<ExternalLink to={linkUrl}>
				{t('Shared_Location')}
			</ExternalLink>
		</Box>;
	}

	return <ExternalLink to={linkUrl}>
		<img src={imageUrl} alt={t('Shared_Location')} />
	</ExternalLink>;
};

export default MessageLocation;
