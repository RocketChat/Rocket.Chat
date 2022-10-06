import { MessageGenericPreviewImage } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import type { UrlPreview } from './PreviewList';

const UrlImagePreview = ({ url }: Pick<UrlPreview, 'url'>): ReactElement => (
	<MessageGenericPreviewImage className='gallery-item' height={192} width={368} url={url || ''} imagePreview />
);

export default UrlImagePreview;
