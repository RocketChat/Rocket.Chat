export type LivechatRoomOnHoldEndpoint = {
	POST: (roomId: string) => {
		success: boolean;
	};
};
