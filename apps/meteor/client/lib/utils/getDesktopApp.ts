type AppointmentData = {
	id: string;
	subject: string;
	startTime: Date;
	endTime: Date;
	description: string;

	isAllDay: boolean;
	isCanceled: boolean;
	organizer?: string;
	meetingUrl?: string;
	reminderMinutesBeforeStart?: number;
	reminderDueBy?: Date;
};

type OutlookEventsResponse =
	| {
			status: 'success';
			data: AppointmentData[];
	  }
	| {
			status: 'canceled';
	  };

type WindowMaybeDesktop = typeof window & {
	RocketChatDesktop?: {
		openInternalVideoChatWindow?: (url: string, options: undefined) => void;
		getOutlookEvents: (date: Date) => Promise<OutlookEventsResponse>;
		setOutlookExchangeUrl: (url: string, userId: string) => Promise<void>;
	};
};

export const getDesktopApp = (): WindowMaybeDesktop['RocketChatDesktop'] => {
	return (window as WindowMaybeDesktop).RocketChatDesktop;
};
