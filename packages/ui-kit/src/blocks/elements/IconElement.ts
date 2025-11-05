type AvailableIcons = 'phone-off' | 'phone-issue' | 'clock' | 'arrow-forward';

export type IconElement = {
	type: 'icon';
	icon: AvailableIcons;
	variant: 'default' | 'danger';
};
