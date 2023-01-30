export type appStatusSpanResponseProps = {
	type?: 'failed' | 'warning';
	icon?: 'warning' | 'checkmark-circled' | 'check';
	label: 'Config Needed' | 'Failed' | 'Disabled' | 'Trial period' | 'Installed' | 'Incompatible';
	tooltipText?: string;
};
