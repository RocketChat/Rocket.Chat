import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { io } from "socket.io-client";

const connectToWebSocket = (url : string, options = {}) => {
	const socket = io(url, options);

	socket.on("connect", () => {
		console.log("WebSocket connected:", socket.id);
		socket.emit("new connection", {
			userId: Meteor.userId(),
			token: Accounts._storedLoginToken(),
		});
	});

	socket.on("disconnect", () => {
		console.log("WebSocket disconnected");
	});

	socket.on("connect_error", (error) => {
		console.error("WebSocket connection error:", error);
	});

	return socket;
};

const socket = connectToWebSocket("http://localhost:3002");

export const emitWebSocketEvent = (event: string, data: any) => {
	socket.emit(event, data);
};

export const registerWebSocketListener = (event: string, callback: ()=> void) =>
	socket.on(event, callback);

export const removeWebSokcetListener = (event: string) => {
	socket.off(event);
}