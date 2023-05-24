export type OmnichannelEventDataSignature = {
	event: 'InquiryTaken';
	data: {
		inquiryId: string;
		roomId: string;
		agentId: string;
	};
};
