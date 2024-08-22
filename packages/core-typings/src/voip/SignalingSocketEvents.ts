export type SignalingSocketEvents = {
	connected: undefined;
	disconnected: undefined;
	connectionerror: unknown;
	localnetworkonline: undefined;
	localnetworkoffline: undefined;
};
export type SocketEventKeys = keyof SignalingSocketEvents;
