export interface IPushNotificationConfig {
	from: string;
	badge: number;
	sound: string;
	priority: number;
	title: string;
	text: string;
	payload: Record<string, any>;
	userId: string;
	notId: number;
	gcm: {
		style: string;
		image: string;
	};
	apn?: {
		category: string;
	};
}
