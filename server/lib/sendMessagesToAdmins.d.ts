type MessageToAdmin = {
	fromId?: string;
	checkFrom?: boolean;
	msgs?: any[] | Function;
	banners?: any[] | Function;
};

export declare function sendMessagesToAdmins(config: MessageToAdmin): void;
