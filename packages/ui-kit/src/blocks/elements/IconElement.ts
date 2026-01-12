type AvailableIcons = 'phone-off' | 'phone-issue' | 'clock' | 'arrow-forward' | 'info' | 'phone-question-mark';

export type IconElement = {
	type: 'icon';
	icon: AvailableIcons;
	variant: 'default' | 'danger' | 'secondary' | 'warning';
};

export type FrameableIconElement = IconElement & {
	framed?: boolean;
};
