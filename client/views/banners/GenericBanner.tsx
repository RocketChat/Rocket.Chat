import { Banner, Icon } from '@rocket.chat/fuselage';
import React, { FC, useEffect } from 'react';

type GenericBannerProps = {
	config: {
		closable?: boolean;
		title?: string;
		text?: string;
		html?: string;
		icon?: string;
		modifiers?: ('large' | 'danger')[];
		timer?: number;
		action: () => void;
		onClose: () => void;
	};
	onAction: () => void;
	onClose: () => void;
};

const GenericBanner: FC<GenericBannerProps> = ({ config, onAction, onClose }) => {
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

export default GenericBanner;
