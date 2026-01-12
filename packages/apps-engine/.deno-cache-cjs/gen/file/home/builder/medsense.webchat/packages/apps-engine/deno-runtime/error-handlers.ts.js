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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9idWlsZGVyL21lZHNlbnNlLndlYmNoYXQvcGFja2FnZXMvYXBwcy1lbmdpbmUvZGVuby1ydW50aW1lL2Vycm9yLWhhbmRsZXJzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIE1lc3NlbmdlciBmcm9tICcuL2xpYi9tZXNzZW5nZXIudHMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVuaGFuZGxlZFJlamVjdGlvbkxpc3RlbmVyKGV2ZW50OiBQcm9taXNlUmVqZWN0aW9uRXZlbnQpIHtcclxuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRjb25zdCB7IHR5cGUsIHJlYXNvbiB9ID0gZXZlbnQ7XHJcblxyXG5cdE1lc3Nlbmdlci5zZW5kTm90aWZpY2F0aW9uKHtcclxuXHRcdG1ldGhvZDogJ3VuaGFuZGxlZFJlamVjdGlvbicsXHJcblx0XHRwYXJhbXM6IFtcclxuXHRcdFx0e1xyXG5cdFx0XHRcdHR5cGUsXHJcblx0XHRcdFx0cmVhc29uOiByZWFzb24gaW5zdGFuY2VvZiBFcnJvciA/IHJlYXNvbi5tZXNzYWdlIDogcmVhc29uLFxyXG5cdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcclxuXHRcdFx0fSxcclxuXHRcdF0sXHJcblx0fSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bmhhbmRsZWRFeGNlcHRpb25MaXN0ZW5lcihldmVudDogRXJyb3JFdmVudCkge1xyXG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdGNvbnN0IHsgdHlwZSwgbWVzc2FnZSwgZmlsZW5hbWUsIGxpbmVubywgY29sbm8gfSA9IGV2ZW50O1xyXG5cdE1lc3Nlbmdlci5zZW5kTm90aWZpY2F0aW9uKHtcclxuXHRcdG1ldGhvZDogJ3VuY2F1Z2h0RXhjZXB0aW9uJyxcclxuXHRcdHBhcmFtczogW3sgdHlwZSwgbWVzc2FnZSwgZmlsZW5hbWUsIGxpbmVubywgY29sbm8gfV0sXHJcblx0fSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHJlZ2lzdGVyRXJyb3JMaXN0ZW5lcnMoKSB7XHJcblx0YWRkRXZlbnRMaXN0ZW5lcigndW5oYW5kbGVkcmVqZWN0aW9uJywgdW5oYW5kbGVkUmVqZWN0aW9uTGlzdGVuZXIpO1xyXG5cdGFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdW5oYW5kbGVkRXhjZXB0aW9uTGlzdGVuZXIpO1xyXG59XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLGVBQWUscUJBQXFCO0FBRWhELE9BQU8sU0FBUywyQkFBMkIsS0FBNEI7RUFDdEUsTUFBTSxjQUFjO0VBRXBCLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFFekIsVUFBVSxnQkFBZ0IsQ0FBQztJQUMxQixRQUFRO0lBQ1IsUUFBUTtNQUNQO1FBQ0M7UUFDQSxRQUFRLGtCQUFrQixRQUFRLE9BQU8sT0FBTyxHQUFHO1FBQ25ELFdBQVcsSUFBSTtNQUNoQjtLQUNBO0VBQ0Y7QUFDRDtBQUVBLE9BQU8sU0FBUywyQkFBMkIsS0FBaUI7RUFDM0QsTUFBTSxjQUFjO0VBRXBCLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUc7RUFDbkQsVUFBVSxnQkFBZ0IsQ0FBQztJQUMxQixRQUFRO0lBQ1IsUUFBUTtNQUFDO1FBQUU7UUFBTTtRQUFTO1FBQVU7UUFBUTtNQUFNO0tBQUU7RUFDckQ7QUFDRDtBQUVBLGVBQWUsU0FBUztFQUN2QixpQkFBaUIsc0JBQXNCO0VBQ3ZDLGlCQUFpQixTQUFTO0FBQzNCIn0=
// denoCacheMetadata=13912835040739672889,16036428244255045899