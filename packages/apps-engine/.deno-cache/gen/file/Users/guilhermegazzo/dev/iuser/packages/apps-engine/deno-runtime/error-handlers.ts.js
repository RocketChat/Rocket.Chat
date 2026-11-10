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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L2l1c2VyL3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9lcnJvci1oYW5kbGVycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBNZXNzZW5nZXIgZnJvbSAnLi9saWIvbWVzc2VuZ2VyLnRzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHVuaGFuZGxlZFJlamVjdGlvbkxpc3RlbmVyKGV2ZW50OiBQcm9taXNlUmVqZWN0aW9uRXZlbnQpIHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRjb25zdCB7IHR5cGUsIHJlYXNvbiB9ID0gZXZlbnQ7XG5cblx0TWVzc2VuZ2VyLnNlbmROb3RpZmljYXRpb24oe1xuXHRcdG1ldGhvZDogJ3VuaGFuZGxlZFJlamVjdGlvbicsXG5cdFx0cGFyYW1zOiBbXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdHJlYXNvbjogcmVhc29uIGluc3RhbmNlb2YgRXJyb3IgPyByZWFzb24ubWVzc2FnZSA6IHJlYXNvbixcblx0XHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuaGFuZGxlZEV4Y2VwdGlvbkxpc3RlbmVyKGV2ZW50OiBFcnJvckV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0Y29uc3QgeyB0eXBlLCBtZXNzYWdlLCBmaWxlbmFtZSwgbGluZW5vLCBjb2xubyB9ID0gZXZlbnQ7XG5cdE1lc3Nlbmdlci5zZW5kTm90aWZpY2F0aW9uKHtcblx0XHRtZXRob2Q6ICd1bmNhdWdodEV4Y2VwdGlvbicsXG5cdFx0cGFyYW1zOiBbeyB0eXBlLCBtZXNzYWdlLCBmaWxlbmFtZSwgbGluZW5vLCBjb2xubyB9XSxcblx0fSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHJlZ2lzdGVyRXJyb3JMaXN0ZW5lcnMoKSB7XG5cdGFkZEV2ZW50TGlzdGVuZXIoJ3VuaGFuZGxlZHJlamVjdGlvbicsIHVuaGFuZGxlZFJlamVjdGlvbkxpc3RlbmVyKTtcblx0YWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCB1bmhhbmRsZWRFeGNlcHRpb25MaXN0ZW5lcik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxlQUFlLHFCQUFxQjtBQUVoRCxPQUFPLFNBQVMsMkJBQTJCLEtBQTRCO0VBQ3RFLE1BQU0sY0FBYztFQUVwQixNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHO0VBRXpCLFVBQVUsZ0JBQWdCLENBQUM7SUFDMUIsUUFBUTtJQUNSLFFBQVE7TUFDUDtRQUNDO1FBQ0EsUUFBUSxrQkFBa0IsUUFBUSxPQUFPLE9BQU8sR0FBRztRQUNuRCxXQUFXLElBQUk7TUFDaEI7S0FDQTtFQUNGO0FBQ0Q7QUFFQSxPQUFPLFNBQVMsMkJBQTJCLEtBQWlCO0VBQzNELE1BQU0sY0FBYztFQUVwQixNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHO0VBQ25ELFVBQVUsZ0JBQWdCLENBQUM7SUFDMUIsUUFBUTtJQUNSLFFBQVE7TUFBQztRQUFFO1FBQU07UUFBUztRQUFVO1FBQVE7TUFBTTtLQUFFO0VBQ3JEO0FBQ0Q7QUFFQSxlQUFlLFNBQVM7RUFDdkIsaUJBQWlCLHNCQUFzQjtFQUN2QyxpQkFBaUIsU0FBUztBQUMzQiJ9