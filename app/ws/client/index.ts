import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { io } from "socket.io-client";

const webSokcetUrl =
  process.env.WEB_SOCKET_SERVICE_URL || "http://localhost:3002";

export const webSocketConnected = new ReactiveVar(false);

const connectToWebSocket = (url: string, options = {}) => {
  const socket = io(url, options);

  socket.on("connect", () => {
    console.log("WebSocket connected:", socket.id);
    webSocketConnected.set(true);
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected");
    webSocketConnected.set(false);
  });

  socket.on("connect_error", (error) => {
    console.error("WebSocket connection error:", error);
  });

  return socket;
};

const socket = connectToWebSocket(webSokcetUrl, {
  auth: {
    userId: Meteor.userId(),
    token: Accounts._storedLoginToken(),
  },
});

const emitToServer = (event: string, data: any) => {
  socket.emit(event, data);
};

const registerListener = (event: string, callback: () => void) =>
  socket.on(event, callback);

const removeListener = (event: string) => {
  socket.off(event);
};

const webSocketHandler = {
  emitToServer,
  registerListener,
  removeListener,
};

export default webSocketHandler;
