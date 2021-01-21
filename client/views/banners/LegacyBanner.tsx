import { Banner, Icon } from '@rocket.chat/fuselage';
import React, { FC, useEffect } from 'react';

import { LegacyBannerPayload } from '../../lib/banners';

type LegacyBannerProps = {
	config: LegacyBannerPayload;
	onAction: () => void;
	onClose: () => void;
};

const LegacyBanner: FC<LegacyBannerProps> = ({ config, onAction, onClose }) => {
	const {
		closable = true,
		title,
		text,
		html,
		icon,
		modifiers,
	} = config;

	const inline = !modifiers?.includes('large');
	const variant = modifiers?.includes('danger') ? 'danger' : 'info';

	useEffect(() => {
		if (!config.timer) {
			return;
		}

		const timer = setTimeout(() => {
			onClose?.();
		}, config.timer);

		return (): void => {
			clearTimeout(timer);
		};
	}, [config.timer, onClose]);

	return <Banner
		inline={inline}
		actionable={!!config.action}
		closeable={closable}
		icon={icon ? <Icon name={icon} size={20} /> : undefined}
		title={title}
		variant={variant}
		onAction={onAction}
		onClose={onClose}
	>
		{text}
		{html && <div dangerouslySetInnerHTML={{ __html: html }} />}
	</Banner>;
};

export default LegacyBanner;
