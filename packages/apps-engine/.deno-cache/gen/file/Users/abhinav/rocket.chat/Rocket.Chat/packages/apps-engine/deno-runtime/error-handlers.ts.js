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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9kZW5vLXJ1bnRpbWUvZXJyb3ItaGFuZGxlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgTWVzc2VuZ2VyIGZyb20gJy4vbGliL21lc3Nlbmdlci50cyc7XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmhhbmRsZWRSZWplY3Rpb25MaXN0ZW5lcihldmVudDogUHJvbWlzZVJlamVjdGlvbkV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IHsgdHlwZSwgcmVhc29uIH0gPSBldmVudDtcblxuICAgIE1lc3Nlbmdlci5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgbWV0aG9kOiAndW5oYW5kbGVkUmVqZWN0aW9uJyxcbiAgICAgICAgcGFyYW1zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICByZWFzb246IHJlYXNvbiBpbnN0YW5jZW9mIEVycm9yID8gcmVhc29uLm1lc3NhZ2UgOiByZWFzb24sXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuaGFuZGxlZEV4Y2VwdGlvbkxpc3RlbmVyKGV2ZW50OiBFcnJvckV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IHsgdHlwZSwgbWVzc2FnZSwgZmlsZW5hbWUsIGxpbmVubywgY29sbm8gfSA9IGV2ZW50O1xuICAgIE1lc3Nlbmdlci5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgbWV0aG9kOiAndW5jYXVnaHRFeGNlcHRpb24nLFxuICAgICAgICBwYXJhbXM6IFt7IHR5cGUsIG1lc3NhZ2UsIGZpbGVuYW1lLCBsaW5lbm8sIGNvbG5vIH1dLFxuICAgIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZWdpc3RlckVycm9yTGlzdGVuZXJzKCkge1xuICAgIGFkZEV2ZW50TGlzdGVuZXIoJ3VuaGFuZGxlZHJlamVjdGlvbicsIHVuaGFuZGxlZFJlamVjdGlvbkxpc3RlbmVyKTtcbiAgICBhZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHVuaGFuZGxlZEV4Y2VwdGlvbkxpc3RlbmVyKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLGVBQWUscUJBQXFCO0FBRWhELE9BQU8sU0FBUywyQkFBMkIsS0FBNEI7RUFDbkUsTUFBTSxjQUFjO0VBRXBCLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFFekIsVUFBVSxnQkFBZ0IsQ0FBQztJQUN2QixRQUFRO0lBQ1IsUUFBUTtNQUNKO1FBQ0k7UUFDQSxRQUFRLGtCQUFrQixRQUFRLE9BQU8sT0FBTyxHQUFHO1FBQ25ELFdBQVcsSUFBSTtNQUNuQjtLQUNIO0VBQ0w7QUFDSjtBQUVBLE9BQU8sU0FBUywyQkFBMkIsS0FBaUI7RUFDeEQsTUFBTSxjQUFjO0VBRXBCLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUc7RUFDbkQsVUFBVSxnQkFBZ0IsQ0FBQztJQUN2QixRQUFRO0lBQ1IsUUFBUTtNQUFDO1FBQUU7UUFBTTtRQUFTO1FBQVU7UUFBUTtNQUFNO0tBQUU7RUFDeEQ7QUFDSjtBQUVBLGVBQWUsU0FBUztFQUNwQixpQkFBaUIsc0JBQXNCO0VBQ3ZDLGlCQUFpQixTQUFTO0FBQzlCIn0=