import stackTrace from 'stack-trace';
import { AppObjectRegistry } from '../AppObjectRegistry.ts';
var LogMessageSeverity = /*#__PURE__*/ function(LogMessageSeverity) {
  LogMessageSeverity["DEBUG"] = "debug";
  LogMessageSeverity["INFORMATION"] = "info";
  LogMessageSeverity["LOG"] = "log";
  LogMessageSeverity["WARNING"] = "warning";
  LogMessageSeverity["ERROR"] = "error";
  LogMessageSeverity["SUCCESS"] = "success";
  return LogMessageSeverity;
}(LogMessageSeverity || {});
export class Logger {
  entries;
  start;
  method;
  constructor(method){
    this.method = method;
    this.entries = [];
    this.start = new Date();
  }
  debug(...args) {
    this.addEntry(LogMessageSeverity.DEBUG, this.getStack(stackTrace.get()), ...args);
  }
  info(...args) {
    this.addEntry(LogMessageSeverity.INFORMATION, this.getStack(stackTrace.get()), ...args);
  }
  log(...args) {
    this.addEntry(LogMessageSeverity.LOG, this.getStack(stackTrace.get()), ...args);
  }
  warn(...args) {
    this.addEntry(LogMessageSeverity.WARNING, this.getStack(stackTrace.get()), ...args);
  }
  error(...args) {
    this.addEntry(LogMessageSeverity.ERROR, this.getStack(stackTrace.get()), ...args);
  }
  success(...args) {
    this.addEntry(LogMessageSeverity.SUCCESS, this.getStack(stackTrace.get()), ...args);
  }
  addEntry(severity, caller, ...items) {
    const i = items.map((args)=>{
      if (args instanceof Error) {
        return JSON.stringify(args, Object.getOwnPropertyNames(args));
      }
      if (typeof args === 'object' && args !== null && 'stack' in args) {
        return JSON.stringify(args, Object.getOwnPropertyNames(args));
      }
      if (typeof args === 'object' && args !== null && 'message' in args) {
        return JSON.stringify(args, Object.getOwnPropertyNames(args));
      }
      const str = JSON.stringify(args, null, 2);
      return str ? JSON.parse(str) : str; // force call toJSON to prevent circular references
    });
    this.entries.push({
      caller,
      severity,
      method: this.method,
      timestamp: new Date(),
      args: i
    });
  }
  getStack(stack) {
    let func = 'anonymous';
    if (stack.length === 1) {
      return func;
    }
    const frame = stack[1];
    if (frame.getMethodName() === null) {
      func = 'anonymous OR constructor';
    } else {
      func = frame.getMethodName();
    }
    if (frame.getFunctionName() !== null) {
      func = `${func} -> ${frame.getFunctionName()}`;
    }
    return func;
  }
  getTotalTime() {
    return new Date().getTime() - this.start.getTime();
  }
  hasEntries() {
    return this.entries.length > 0;
  }
  getLogs() {
    return {
      appId: AppObjectRegistry.get('id'),
      method: this.method,
      entries: this.entries,
      startTime: this.start,
      endTime: new Date(),
      totalTime: this.getTotalTime(),
      _createdAt: new Date()
    };
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9saWIvbG9nZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdGFja1RyYWNlIGZyb20gJ3N0YWNrLXRyYWNlJztcbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0YWNrRnJhbWUge1xuXHRnZXRUeXBlTmFtZSgpOiBzdHJpbmc7XG5cdGdldEZ1bmN0aW9uTmFtZSgpOiBzdHJpbmc7XG5cdGdldE1ldGhvZE5hbWUoKTogc3RyaW5nO1xuXHRnZXRGaWxlTmFtZSgpOiBzdHJpbmc7XG5cdGdldExpbmVOdW1iZXIoKTogbnVtYmVyO1xuXHRnZXRDb2x1bW5OdW1iZXIoKTogbnVtYmVyO1xuXHRpc05hdGl2ZSgpOiBib29sZWFuO1xuXHRpc0NvbnN0cnVjdG9yKCk6IGJvb2xlYW47XG59XG5cbmVudW0gTG9nTWVzc2FnZVNldmVyaXR5IHtcblx0REVCVUcgPSAnZGVidWcnLFxuXHRJTkZPUk1BVElPTiA9ICdpbmZvJyxcblx0TE9HID0gJ2xvZycsXG5cdFdBUk5JTkcgPSAnd2FybmluZycsXG5cdEVSUk9SID0gJ2Vycm9yJyxcblx0U1VDQ0VTUyA9ICdzdWNjZXNzJyxcbn1cblxudHlwZSBFbnRyeSA9IHtcblx0Y2FsbGVyOiBzdHJpbmc7XG5cdHNldmVyaXR5OiBMb2dNZXNzYWdlU2V2ZXJpdHk7XG5cdG1ldGhvZDogc3RyaW5nO1xuXHR0aW1lc3RhbXA6IERhdGU7XG5cdGFyZ3M6IEFycmF5PHVua25vd24+O1xufTtcblxuaW50ZXJmYWNlIElMb2dnZXJTdG9yYWdlRW50cnkge1xuXHRhcHBJZDogc3RyaW5nO1xuXHRtZXRob2Q6IHN0cmluZztcblx0ZW50cmllczogQXJyYXk8RW50cnk+O1xuXHRzdGFydFRpbWU6IERhdGU7XG5cdGVuZFRpbWU6IERhdGU7XG5cdHRvdGFsVGltZTogbnVtYmVyO1xuXHRfY3JlYXRlZEF0OiBEYXRlO1xufVxuXG5leHBvcnQgY2xhc3MgTG9nZ2VyIHtcblx0cHJpdmF0ZSBlbnRyaWVzOiBBcnJheTxFbnRyeT47XG5cdHByaXZhdGUgc3RhcnQ6IERhdGU7XG5cdHByaXZhdGUgbWV0aG9kOiBzdHJpbmc7XG5cblx0Y29uc3RydWN0b3IobWV0aG9kOiBzdHJpbmcpIHtcblx0XHR0aGlzLm1ldGhvZCA9IG1ldGhvZDtcblx0XHR0aGlzLmVudHJpZXMgPSBbXTtcblx0XHR0aGlzLnN0YXJ0ID0gbmV3IERhdGUoKTtcblx0fVxuXG5cdHB1YmxpYyBkZWJ1ZyguLi5hcmdzOiBBcnJheTx1bmtub3duPik6IHZvaWQge1xuXHRcdHRoaXMuYWRkRW50cnkoTG9nTWVzc2FnZVNldmVyaXR5LkRFQlVHLCB0aGlzLmdldFN0YWNrKHN0YWNrVHJhY2UuZ2V0KCkpLCAuLi5hcmdzKTtcblx0fVxuXG5cdHB1YmxpYyBpbmZvKC4uLmFyZ3M6IEFycmF5PHVua25vd24+KTogdm9pZCB7XG5cdFx0dGhpcy5hZGRFbnRyeShMb2dNZXNzYWdlU2V2ZXJpdHkuSU5GT1JNQVRJT04sIHRoaXMuZ2V0U3RhY2soc3RhY2tUcmFjZS5nZXQoKSksIC4uLmFyZ3MpO1xuXHR9XG5cblx0cHVibGljIGxvZyguLi5hcmdzOiBBcnJheTx1bmtub3duPik6IHZvaWQge1xuXHRcdHRoaXMuYWRkRW50cnkoTG9nTWVzc2FnZVNldmVyaXR5LkxPRywgdGhpcy5nZXRTdGFjayhzdGFja1RyYWNlLmdldCgpKSwgLi4uYXJncyk7XG5cdH1cblxuXHRwdWJsaWMgd2FybiguLi5hcmdzOiBBcnJheTx1bmtub3duPik6IHZvaWQge1xuXHRcdHRoaXMuYWRkRW50cnkoTG9nTWVzc2FnZVNldmVyaXR5LldBUk5JTkcsIHRoaXMuZ2V0U3RhY2soc3RhY2tUcmFjZS5nZXQoKSksIC4uLmFyZ3MpO1xuXHR9XG5cblx0cHVibGljIGVycm9yKC4uLmFyZ3M6IEFycmF5PHVua25vd24+KTogdm9pZCB7XG5cdFx0dGhpcy5hZGRFbnRyeShMb2dNZXNzYWdlU2V2ZXJpdHkuRVJST1IsIHRoaXMuZ2V0U3RhY2soc3RhY2tUcmFjZS5nZXQoKSksIC4uLmFyZ3MpO1xuXHR9XG5cblx0cHVibGljIHN1Y2Nlc3MoLi4uYXJnczogQXJyYXk8dW5rbm93bj4pOiB2b2lkIHtcblx0XHR0aGlzLmFkZEVudHJ5KExvZ01lc3NhZ2VTZXZlcml0eS5TVUNDRVNTLCB0aGlzLmdldFN0YWNrKHN0YWNrVHJhY2UuZ2V0KCkpLCAuLi5hcmdzKTtcblx0fVxuXG5cdHByaXZhdGUgYWRkRW50cnkoc2V2ZXJpdHk6IExvZ01lc3NhZ2VTZXZlcml0eSwgY2FsbGVyOiBzdHJpbmcsIC4uLml0ZW1zOiBBcnJheTx1bmtub3duPik6IHZvaWQge1xuXHRcdGNvbnN0IGkgPSBpdGVtcy5tYXAoKGFyZ3MpID0+IHtcblx0XHRcdGlmIChhcmdzIGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3MsIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGFyZ3MpKTtcblx0XHRcdH1cblx0XHRcdGlmICh0eXBlb2YgYXJncyA9PT0gJ29iamVjdCcgJiYgYXJncyAhPT0gbnVsbCAmJiAnc3RhY2snIGluIGFyZ3MpIHtcblx0XHRcdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3MsIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGFyZ3MpKTtcblx0XHRcdH1cblx0XHRcdGlmICh0eXBlb2YgYXJncyA9PT0gJ29iamVjdCcgJiYgYXJncyAhPT0gbnVsbCAmJiAnbWVzc2FnZScgaW4gYXJncykge1xuXHRcdFx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJncywgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYXJncykpO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3Qgc3RyID0gSlNPTi5zdHJpbmdpZnkoYXJncywgbnVsbCwgMik7XG5cdFx0XHRyZXR1cm4gc3RyID8gSlNPTi5wYXJzZShzdHIpIDogc3RyOyAvLyBmb3JjZSBjYWxsIHRvSlNPTiB0byBwcmV2ZW50IGNpcmN1bGFyIHJlZmVyZW5jZXNcblx0XHR9KTtcblxuXHRcdHRoaXMuZW50cmllcy5wdXNoKHtcblx0XHRcdGNhbGxlcixcblx0XHRcdHNldmVyaXR5LFxuXHRcdFx0bWV0aG9kOiB0aGlzLm1ldGhvZCxcblx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdGFyZ3M6IGksXG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGdldFN0YWNrKHN0YWNrOiBBcnJheTxTdGFja0ZyYW1lPik6IHN0cmluZyB7XG5cdFx0bGV0IGZ1bmMgPSAnYW5vbnltb3VzJztcblxuXHRcdGlmIChzdGFjay5sZW5ndGggPT09IDEpIHtcblx0XHRcdHJldHVybiBmdW5jO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZyYW1lID0gc3RhY2tbMV07XG5cblx0XHRpZiAoZnJhbWUuZ2V0TWV0aG9kTmFtZSgpID09PSBudWxsKSB7XG5cdFx0XHRmdW5jID0gJ2Fub255bW91cyBPUiBjb25zdHJ1Y3Rvcic7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZ1bmMgPSBmcmFtZS5nZXRNZXRob2ROYW1lKCk7XG5cdFx0fVxuXG5cdFx0aWYgKGZyYW1lLmdldEZ1bmN0aW9uTmFtZSgpICE9PSBudWxsKSB7XG5cdFx0XHRmdW5jID0gYCR7ZnVuY30gLT4gJHtmcmFtZS5nZXRGdW5jdGlvbk5hbWUoKX1gO1xuXHRcdH1cblxuXHRcdHJldHVybiBmdW5jO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRUb3RhbFRpbWUoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aGlzLnN0YXJ0LmdldFRpbWUoKTtcblx0fVxuXG5cdHB1YmxpYyBoYXNFbnRyaWVzKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmVudHJpZXMubGVuZ3RoID4gMDtcblx0fVxuXG5cdHB1YmxpYyBnZXRMb2dzKCk6IElMb2dnZXJTdG9yYWdlRW50cnkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRhcHBJZDogQXBwT2JqZWN0UmVnaXN0cnkuZ2V0KCdpZCcpISxcblx0XHRcdG1ldGhvZDogdGhpcy5tZXRob2QsXG5cdFx0XHRlbnRyaWVzOiB0aGlzLmVudHJpZXMsXG5cdFx0XHRzdGFydFRpbWU6IHRoaXMuc3RhcnQsXG5cdFx0XHRlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuXHRcdFx0dG90YWxUaW1lOiB0aGlzLmdldFRvdGFsVGltZSgpLFxuXHRcdFx0X2NyZWF0ZWRBdDogbmV3IERhdGUoKSxcblx0XHR9O1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxnQkFBZ0IsY0FBYztBQUNyQyxTQUFTLGlCQUFpQixRQUFRLDBCQUEwQjtBQWE1RCxJQUFBLEFBQUssNENBQUE7Ozs7Ozs7U0FBQTtFQUFBO0FBMkJMLE9BQU8sTUFBTTtFQUNKLFFBQXNCO0VBQ3RCLE1BQVk7RUFDWixPQUFlO0VBRXZCLFlBQVksTUFBYyxDQUFFO0lBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDZCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUU7SUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJO0VBQ2xCO0VBRU8sTUFBTSxHQUFHLElBQW9CLEVBQVE7SUFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLFFBQVE7RUFDN0U7RUFFTyxLQUFLLEdBQUcsSUFBb0IsRUFBUTtJQUMxQyxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsUUFBUTtFQUNuRjtFQUVPLElBQUksR0FBRyxJQUFvQixFQUFRO0lBQ3pDLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxRQUFRO0VBQzNFO0VB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
// denoCacheMetadata=15494465698047276759,2632065669814233871