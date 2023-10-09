export type FeatureSet = {
	type: 'neutral' | 'success';
	title: string;
	infoText?: string;
};

type PlanFeatures = {
	community: FeatureSet[];
	starter: FeatureSet[];
	enterprise: FeatureSet[];
	pro: FeatureSet[];
};

export const planFeatures: PlanFeatures = {
	community: [
		{
			type: 'success',
			title: 'Unlimited_seats_and_MACs',
		},
		{
			type: 'neutral',
			title: 'Unlimited_push_notifications',
		},
		{
			type: 'neutral',
			title: 'Premium_and_unlimited_apps',
		},
		{
			type: 'neutral',
			title: 'Premium_omnichannel_capabilities',
		},
		{
			type: 'neutral',
			title: 'Remove_RocketChat_Watermark',
		},
		{
			type: 'neutral',
			title: 'Video_call_manager',
		},
	],
	starter: [
		{
			type: 'success',
			title: 'Premium_and_unlimited_apps',
		},
		{
			type: 'success',
			title: 'Premium_omnichannel_capabilities',
		},
		{
			type: 'success',
			title: 'Unlimited_push_notifications',
		},
		{
			type: 'neutral',
			title: 'Remove_RocketChat_Watermark',
		},
		{
			type: 'neutral',
			title: 'Up_to_N_seats',
		},
		{
			type: 'neutral',
			title: 'Up_to_N_MACs',
		},
	],
	enterprise: [
		{
			type: 'success',
			title: 'High_scalabaility',
		},
		{
			type: 'success',
			title: 'Custom_roles',
		},
		{
			type: 'success',
			title: 'Premium_and_unlimited_apps',
		},
		{
			type: 'success',
			title: 'Analytics',
		},
		{
			type: 'success',
			title: 'Message_audit',
		},
		{
			type: 'success',
			title: 'Advanced_authentication_services',
		},
	],
	pro: [
		{
			type: 'success',
			title: 'Premium_and_unlimited_apps',
		},
		{
			type: 'success',
			title: 'Premium_omnichannel_capabilities',
		},
		{
			type: 'success',
			title: 'Video_call_manager',
		},
		{
			type: 'success',
			title: 'Unlimited_push_notifications',
		},
		{
			type: 'neutral',
			title: 'High_scalabaility',
		},
	],
};
