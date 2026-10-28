export {};

declare global {
	interface Window {
		SERVER_URL: string;
		RocketChat: {
			// TODO: Discover what the hell does "_" do
			_: any;
			url?: string;
			// TODO: Type this
			livechat: {
				pageVisited;
				setCustomField;
				initialize;
				setTheme;
				setDepartment;
				clearDepartment;
				setGuestToken;
				setGuestName;
				setGuestEmail;
				setAgent;
				registerGuest;
				setLanguage;
				showWidget;
				hideWidget;
				maximizeWidget;
				minimizeWidget;
				setBusinessUnit;
				clearBusinessUnit;
				setParentUrl;

				// callbacks
				onChatMaximized;
				onChatMinimized;
				onChatStarted;
				onChatEnded;
				onPrechatFormSubmit;
				onOfflineFormSubmit;
				onWidgetShown;
				onWidgetHidden;
				onAssignAgent;
				onAgentStatusChange;
				onQueuePositionChange;
				onServiceOffline;
			};
		};
		initRocket?: string[];
	}

	interface Document {
		msHidden?: Document['hidden'];
		webkitHidden?: Document['hidden'];
		parentWindow?: Window;
		selection?: Selection;
	}

	interface Selection {
		createRange?: () => Range;
	}

	interface HTMLElement {
		document?: Document;
		createTextRange?: () => Range;
	}

	interface Range {
		moveToElementText?: (el: HTMLElement) => void;
		setEndPoint?: (type: string, endRange: Range) => void;
		text?: string;
	}
}
