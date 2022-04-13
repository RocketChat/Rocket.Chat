export type SignallinSocketEvents = {
	connected: undefined;
	disconnected: undefined;
	connectionerror: unknown;
	localnetworkonline: undefined;
	localnetworkoffline: undefined;
};
export type SocketEventKeys = keyof SignallinSocketEvents;
