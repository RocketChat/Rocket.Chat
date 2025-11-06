type AvailableIcons = 'phone-off' | 'phone-issue' | 'clock' | 'arrow-forward' | 'info';

export type IconElement = {
	type: 'icon';
	icon: AvailableIcons;
	variant: 'default' | 'danger';
};
