import * as Messenger from './lib/messenger.ts';
export function unhandledRejectionListener(event) {
  event.preventDefault();
  const { type, reason } = event;
  Messenger.sendNotification({
    method: 'unhandledRejection',
    params: [
      {
        type,
        reason: reason instanceof Error ? reason.message : reason,
        timestamp: new Date()
      }
    ]
  });
}
export function unhandledExceptionListener(event) {
  event.preventDefault();
  const { type, message, filename, lineno, colno } = event;
  Messenger.sendNotification({
    method: 'uncaughtException',
    params: [
      {
        type,
        message,
        filename,
        lineno,
        colno
      }
    ]
  });
}
export default function registerErrorListeners() {
  addEventListener('unhandledrejection', unhandledRejectionListener);
  addEventListener('error', unhandledExceptionListener);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdmFyL2ZvbGRlcnMvcHQvNnBqM3hjMzk3ZzkxZF9qa3F6eDdtbmp3MDAwMGduL1QvYXBwcy1lbmdpbmUtdGVtcC9kZW5vLXJ1bnRpbWUvZXJyb3ItaGFuZGxlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgTWVzc2VuZ2VyIGZyb20gJy4vbGliL21lc3Nlbmdlci50cyc7XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmhhbmRsZWRSZWplY3Rpb25MaXN0ZW5lcihldmVudDogUHJvbWlzZVJlamVjdGlvbkV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0Y29uc3QgeyB0eXBlLCByZWFzb24gfSA9IGV2ZW50O1xuXG5cdE1lc3Nlbmdlci5zZW5kTm90aWZpY2F0aW9uKHtcblx0XHRtZXRob2Q6ICd1bmhhbmRsZWRSZWplY3Rpb24nLFxuXHRcdHBhcmFtczogW1xuXHRcdFx0e1xuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHRyZWFzb246IHJlYXNvbiBpbnN0YW5jZW9mIEVycm9yID8gcmVhc29uLm1lc3NhZ2UgOiByZWFzb24sXG5cdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmhhbmRsZWRFeGNlcHRpb25MaXN0ZW5lcihldmVudDogRXJyb3JFdmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdGNvbnN0IHsgdHlwZSwgbWVzc2FnZSwgZmlsZW5hbWUsIGxpbmVubywgY29sbm8gfSA9IGV2ZW50O1xuXHRNZXNzZW5nZXIuc2VuZE5vdGlmaWNhdGlvbih7XG5cdFx0bWV0aG9kOiAndW5jYXVnaHRFeGNlcHRpb24nLFxuXHRcdHBhcmFtczogW3sgdHlwZSwgbWVzc2FnZSwgZmlsZW5hbWUsIGxpbmVubywgY29sbm8gfV0sXG5cdH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZWdpc3RlckVycm9yTGlzdGVuZXJzKCkge1xuXHRhZGRFdmVudExpc3RlbmVyKCd1bmhhbmRsZWRyZWplY3Rpb24nLCB1bmhhbmRsZWRSZWplY3Rpb25MaXN0ZW5lcik7XG5cdGFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdW5oYW5kbGVkRXhjZXB0aW9uTGlzdGVuZXIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksZUFBZSxxQkFBcUI7QUFFaEQsT0FBTyxTQUFTLDJCQUEyQixLQUE0QjtFQUN0RSxNQUFNLGNBQWM7RUFFcEIsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRztFQUV6QixVQUFVLGdCQUFnQixDQUFDO0lBQzFCLFFBQVE7SUFDUixRQUFRO01BQ1A7UUFDQztRQUNBLFFBQVEsa0JBQWtCLFFBQVEsT0FBTyxPQUFPLEdBQUc7UUFDbkQsV0FBVyxJQUFJO01BQ2hCO0tBQ0E7RUFDRjtBQUNEO0FBRUEsT0FBTyxTQUFTLDJCQUEyQixLQUFpQjtFQUMzRCxNQUFNLGNBQWM7RUFFcEIsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRztFQUNuRCxVQUFVLGdCQUFnQixDQUFDO0lBQzFCLFFBQVE7SUFDUixRQUFRO01BQUM7UUFBRTtRQUFNO1FBQVM7UUFBVTtRQUFRO01BQU07S0FBRTtFQUNyRDtBQUNEO0FBRUEsZUFBZSxTQUFTO0VBQ3ZCLGlCQUFpQixzQkFBc0I7RUFDdkMsaUJBQWlCLFNBQVM7QUFDM0IifQ==
// denoCacheMetadata=1940073809326098910,4673738473495439148