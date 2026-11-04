type AvailableIcons =
	| 'phone'
	| 'phone-off'
	| 'phone-issue'
	| 'clock'
	| 'arrow-forward'
	| 'info'
	| 'phone-question-mark'
	| 'copy'
	| 'flag'
	| 'trash'
	| 'edit'
	| 'link'
	| 'check'
	| 'cross'
	| 'star'
	| 'pin'
	| 'share'
	| 'download'
	| 'eye'
	| 'bell'
	| 'kebab';

export type IconElement = {
	type: 'icon';
	icon: AvailableIcons;
	variant: 'default' | 'danger' | 'secondary' | 'warning';
};

export type FrameableIconElement = IconElement & {
	framed?: boolean;
};
