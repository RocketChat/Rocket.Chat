import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { io } from "socket.io-client";
import { CachedCollectionManager } from "/app/ui-cached-collection";

const webSokcetUrl =
  process.env.WEB_SOCKET_SERVICE_URL || "http://localhost:3002";

export const webSocketConnected = new ReactiveVar(false);
export const loggedIn = new ReactiveVar(false);
export const reconnectionTimer = new ReactiveVar(0);

let countdownTimer;
const showCountdown = (seconds: number) => {
  clearInterval(countdownTimer);

  const update = () => {
    reconnectionTimer.set(seconds);
    seconds--;

    if (seconds < 0) clearInterval(countdownTimer);
  };

  update();
  countdownTimer = setInterval(update, 1000);
};

let socket: Socket | null = null;

Meteor.startup(() =>
  CachedCollectionManager.onLogin(() => {
    loggedIn.set(true);
    connectToWebSocket(webSokcetUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 50000,
      randomizationFactor: 0.5,
      timeout: 20000,
      auth: {
        userId: Meteor.userId(),
        token: Accounts._storedLoginToken(),
      },
    });
  })
);
const connectToWebSocket = (url: string, options = {}) => {
  socket = io(url, options);

  socket.on("connect", () => {
    console.log("WebSocket connected:", socket.id);
    webSocketConnected.set(true);
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected");
    webSocketConnected.set(false);
  });

  socket.on("connect_error", (error) => {
    webSocketConnected.set(false);
    console.error("WebSocket connection error:", error);
  });

  socket.io.on("reconnect_attempt", (attempt: number) => {
    const baseDelay = socket.io.opts.reconnectionDelay;
    const nextDelay = Math.min(
      baseDelay * Math.pow(2, attempt),
      socket.io.opts.reconnectionDelayMax
    );
    showCountdown(Math.ceil(nextDelay / 1000));
  });

  return socket;
};

const emitToServer = (event: string, data: any) => {
  socket?.emit(event, data);
};

const registerListener = (event: string, callback: () => void) =>
  socket?.on(event, callback);

const removeListener = (event: string) => {
  socket?.off(event);
};

const reconnect = () => {
  socket?.disconnect();
  socket?.connect();
};

const webSocketHandler = {
  emitToServer,
  registerListener,
  removeListener,
  reconnect,
};

export default webSocketHandler;
