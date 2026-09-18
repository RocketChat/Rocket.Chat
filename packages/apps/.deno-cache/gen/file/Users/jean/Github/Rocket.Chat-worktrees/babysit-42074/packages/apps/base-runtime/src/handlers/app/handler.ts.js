import { JsonRpcError } from 'jsonrpc-lite';
import handleConstructApp from './construct';
import handleGetStatus from './handleGetStatus';
import handleInitialize from './handleInitialize';
import handleOnDisable from './handleOnDisable';
import handleOnEnable from './handleOnEnable';
import handleOnInstall from './handleOnInstall';
import handleOnPreSettingUpdate from './handleOnPreSettingUpdate';
import handleOnSettingUpdated from './handleOnSettingUpdated';
import handleOnUninstall from './handleOnUninstall';
import handleOnUpdate from './handleOnUpdate';
import handleSetStatus from './handleSetStatus';
import handleUploadEvents, { uploadEvents } from './handleUploadEvents';
import { isOneOf } from '../lib/assertions';
import handleListener from '../listener/handler';
import handleUIKitInteraction, { uikitInteractions } from '../uikit/handler';
export default async function handleApp(request) {
  const { method } = request;
  const { logger } = request.context;
  const [, appMethod] = method.split(':');
  try {
    // We don't want the getStatus method to generate logs, so we handle it separately
    if (appMethod === 'getStatus') {
      return await handleGetStatus();
    }
    logger.debug({
      msg: `A method is being called...`,
      appMethod
    });
    const formatResult = (result)=>{
      if (result instanceof JsonRpcError) {
        logger.debug({
          msg: `'${appMethod}' was unsuccessful.`,
          appMethod,
          err: result,
          errorMessage: result.message
        });
      } else {
        logger.debug({
          msg: `'${appMethod}' was successfully called! The result is:`,
          appMethod,
          result
        });
      }
      return result;
    };
    let result = undefined;
    if (isOneOf(appMethod, uploadEvents)) {
      result = handleUploadEvents(request);
    } else if (isOneOf(appMethod, uikitInteractions)) {
      result = handleUIKitInteraction(request);
    } else if (appMethod.startsWith('check') || appMethod.startsWith('execute')) {
      result = handleListener(request);
    }
    switch(appMethod){
      case 'construct':
        result = handleConstructApp(request);
        break;
      case 'initialize':
        result = handleInitialize(request);
        break;
      case 'setStatus':
        result = handleSetStatus(request);
        break;
      case 'onEnable':
        result = handleOnEnable(request);
        break;
      case 'onDisable':
        result = handleOnDisable(request);
        break;
      case 'onInstall':
        result = handleOnInstall(request);
        break;
      case 'onUninstall':
        result = handleOnUninstall(request);
        break;
      case 'onPreSettingUpdate':
        result = handleOnPreSettingUpdate(request);
        break;
      case 'onSettingUpdated':
        result = handleOnSettingUpdated(request);
        break;
      case 'onUpdate':
        result = handleOnUpdate(request);
        break;
    }
    if (typeof result === 'undefined') {
      throw new JsonRpcError(`Unknown method "${appMethod}"`, -32601);
    }
    return await result.then(formatResult);
  } catch (e) {
    if (!(e instanceof Error)) {
      return new JsonRpcError('Unknown error', -32000, e);
    }
    if (e.cause?.includes('invalid_param_type')) {
      return JsonRpcError.invalidParams(null);
    }
    if (e.cause?.includes('invalid_app')) {
      return JsonRpcError.internalError({
        message: 'App unavailable'
      });
    }
    return new JsonRpcError(e.message, -32000, e);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvamVhbi9HaXRodWIvUm9ja2V0LkNoYXQtd29ya3RyZWVzL2JhYnlzaXQtNDIwNzQvcGFja2FnZXMvYXBwcy9iYXNlLXJ1bnRpbWUvc3JjL2hhbmRsZXJzL2FwcC9oYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRGVmaW5lZCB9IGZyb20gJ2pzb25ycGMtbGl0ZSc7XG5pbXBvcnQgeyBKc29uUnBjRXJyb3IgfSBmcm9tICdqc29ucnBjLWxpdGUnO1xuXG5pbXBvcnQgaGFuZGxlQ29uc3RydWN0QXBwIGZyb20gJy4vY29uc3RydWN0JztcbmltcG9ydCBoYW5kbGVHZXRTdGF0dXMgZnJvbSAnLi9oYW5kbGVHZXRTdGF0dXMnO1xuaW1wb3J0IGhhbmRsZUluaXRpYWxpemUgZnJvbSAnLi9oYW5kbGVJbml0aWFsaXplJztcbmltcG9ydCBoYW5kbGVPbkRpc2FibGUgZnJvbSAnLi9oYW5kbGVPbkRpc2FibGUnO1xuaW1wb3J0IGhhbmRsZU9uRW5hYmxlIGZyb20gJy4vaGFuZGxlT25FbmFibGUnO1xuaW1wb3J0IGhhbmRsZU9uSW5zdGFsbCBmcm9tICcuL2hhbmRsZU9uSW5zdGFsbCc7XG5pbXBvcnQgaGFuZGxlT25QcmVTZXR0aW5nVXBkYXRlIGZyb20gJy4vaGFuZGxlT25QcmVTZXR0aW5nVXBkYXRlJztcbmltcG9ydCBoYW5kbGVPblNldHRpbmdVcGRhdGVkIGZyb20gJy4vaGFuZGxlT25TZXR0aW5nVXBkYXRlZCc7XG5pbXBvcnQgaGFuZGxlT25Vbmluc3RhbGwgZnJvbSAnLi9oYW5kbGVPblVuaW5zdGFsbCc7XG5pbXBvcnQgaGFuZGxlT25VcGRhdGUgZnJvbSAnLi9oYW5kbGVPblVwZGF0ZSc7XG5pbXBvcnQgaGFuZGxlU2V0U3RhdHVzIGZyb20gJy4vaGFuZGxlU2V0U3RhdHVzJztcbmltcG9ydCBoYW5kbGVVcGxvYWRFdmVudHMsIHsgdXBsb2FkRXZlbnRzIH0gZnJvbSAnLi9oYW5kbGVVcGxvYWRFdmVudHMnO1xuaW1wb3J0IHR5cGUgeyBSZXF1ZXN0Q29udGV4dCB9IGZyb20gJy4uLy4uL2xpYi9yZXF1ZXN0Q29udGV4dCc7XG5pbXBvcnQgeyBpc09uZU9mIH0gZnJvbSAnLi4vbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IGhhbmRsZUxpc3RlbmVyIGZyb20gJy4uL2xpc3RlbmVyL2hhbmRsZXInO1xuaW1wb3J0IGhhbmRsZVVJS2l0SW50ZXJhY3Rpb24sIHsgdWlraXRJbnRlcmFjdGlvbnMgfSBmcm9tICcuLi91aWtpdC9oYW5kbGVyJztcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlQXBwKHJlcXVlc3Q6IFJlcXVlc3RDb250ZXh0KTogUHJvbWlzZTxEZWZpbmVkIHwgSnNvblJwY0Vycm9yPiB7XG5cdGNvbnN0IHsgbWV0aG9kIH0gPSByZXF1ZXN0O1xuXHRjb25zdCB7IGxvZ2dlciB9ID0gcmVxdWVzdC5jb250ZXh0O1xuXHRjb25zdCBbLCBhcHBNZXRob2RdID0gbWV0aG9kLnNwbGl0KCc6Jyk7XG5cblx0dHJ5IHtcblx0XHQvLyBXZSBkb24ndCB3YW50IHRoZSBnZXRTdGF0dXMgbWV0aG9kIHRvIGdlbmVyYXRlIGxvZ3MsIHNvIHdlIGhhbmRsZSBpdCBzZXBhcmF0ZWx5XG5cdFx0aWYgKGFwcE1ldGhvZCA9PT0gJ2dldFN0YXR1cycpIHtcblx0XHRcdHJldHVybiBhd2FpdCBoYW5kbGVHZXRTdGF0dXMoKTtcblx0XHR9XG5cblx0XHRsb2dnZXIuZGVidWcoeyBtc2c6IGBBIG1ldGhvZCBpcyBiZWluZyBjYWxsZWQuLi5gLCBhcHBNZXRob2QgfSk7XG5cblx0XHRjb25zdCBmb3JtYXRSZXN1bHQgPSAocmVzdWx0OiBEZWZpbmVkIHwgSnNvblJwY0Vycm9yKTogRGVmaW5lZCB8IEpzb25ScGNFcnJvciA9PiB7XG5cdFx0XHRpZiAocmVzdWx0IGluc3RhbmNlb2YgSnNvblJwY0Vycm9yKSB7XG5cdFx0XHRcdGxvZ2dlci5kZWJ1Zyh7XG5cdFx0XHRcdFx0bXNnOiBgJyR7YXBwTWV0aG9kfScgd2FzIHVuc3VjY2Vzc2Z1bC5gLFxuXHRcdFx0XHRcdGFwcE1ldGhvZCxcblx0XHRcdFx0XHRlcnI6IHJlc3VsdCxcblx0XHRcdFx0XHRlcnJvck1lc3NhZ2U6IHJlc3VsdC5tZXNzYWdlLFxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxvZ2dlci5kZWJ1Zyh7XG5cdFx0XHRcdFx0bXNnOiBgJyR7YXBwTWV0aG9kfScgd2FzIHN1Y2Nlc3NmdWxseSBjYWxsZWQhIFRoZSByZXN1bHQgaXM6YCxcblx0XHRcdFx0XHRhcHBNZXRob2QsXG5cdFx0XHRcdFx0cmVzdWx0LFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9O1xuXG5cdFx0bGV0IHJlc3VsdDogUHJvbWlzZTxEZWZpbmVkIHwgSnNvblJwY0Vycm9yPiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuXHRcdGlmIChpc09uZU9mKGFwcE1ldGhvZCwgdXBsb2FkRXZlbnRzKSkge1xuXHRcdFx0cmVzdWx0ID0gaGFuZGxlVXBsb2FkRXZlbnRzKHJlcXVlc3QpO1xuXHRcdH0gZWxzZSBpZiAoaXNPbmVPZihhcHBNZXRob2QsIHVpa2l0SW50ZXJhY3Rpb25zKSkge1xuXHRcdFx0cmVzdWx0ID0gaGFuZGxlVUlLaXRJbnRlcmFjdGlvbihyZXF1ZXN0KTtcblx0XHR9IGVsc2UgaWYgKGFwcE1ldGhvZC5zdGFydHNXaXRoKCdjaGVjaycpIHx8IGFwcE1ldGhvZC5zdGFydHNXaXRoKCdleGVjdXRlJykpIHtcblx0XHRcdHJlc3VsdCA9IGhhbmRsZUxpc3RlbmVyKHJlcXVlc3QpO1xuXHRcdH1cblxuXHRcdHN3aXRjaCAoYXBwTWV0aG9kKSB7XG5cdFx0XHRjYXNlICdjb25zdHJ1Y3QnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVDb25zdHJ1Y3RBcHAocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnaW5pdGlhbGl6ZSc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZUluaXRpYWxpemUocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnc2V0U3RhdHVzJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlU2V0U3RhdHVzKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ29uRW5hYmxlJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlT25FbmFibGUocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnb25EaXNhYmxlJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlT25EaXNhYmxlKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ29uSW5zdGFsbCc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZU9uSW5zdGFsbChyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdvblVuaW5zdGFsbCc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZU9uVW5pbnN0YWxsKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ29uUHJlU2V0dGluZ1VwZGF0ZSc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZU9uUHJlU2V0dGluZ1VwZGF0ZShyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdvblNldHRpbmdVcGRhdGVkJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlT25TZXR0aW5nVXBkYXRlZChyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdvblVwZGF0ZSc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZU9uVXBkYXRlKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRocm93IG5ldyBKc29uUnBjRXJyb3IoYFVua25vd24gbWV0aG9kIFwiJHthcHBNZXRob2R9XCJgLCAtMzI2MDEpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhd2FpdCByZXN1bHQudGhlbihmb3JtYXRSZXN1bHQpO1xuXHR9IGNhdGNoIChlOiB1bmtub3duKSB7XG5cdFx0aWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xuXHRcdFx0cmV0dXJuIG5ldyBKc29uUnBjRXJyb3IoJ1Vua25vd24gZXJyb3InLCAtMzIwMDAsIGUpO1xuXHRcdH1cblxuXHRcdGlmICgoZS5jYXVzZSBhcyBzdHJpbmcpPy5pbmNsdWRlcygnaW52YWxpZF9wYXJhbV90eXBlJykpIHtcblx0XHRcdHJldHVybiBKc29uUnBjRXJyb3IuaW52YWxpZFBhcmFtcyhudWxsKTtcblx0XHR9XG5cblx0XHRpZiAoKGUuY2F1c2UgYXMgc3RyaW5nKT8uaW5jbHVkZXMoJ2ludmFsaWRfYXBwJykpIHtcblx0XHRcdHJldHVybiBKc29uUnBjRXJyb3IuaW50ZXJuYWxFcnJvcih7IG1lc3NhZ2U6ICdBcHAgdW5hdmFpbGFibGUnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBuZXcgSnNvblJwY0Vycm9yKGUubWVzc2FnZSwgLTMyMDAwLCBlKTtcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsWUFBWSxRQUFRLGVBQWU7QUFFNUMsT0FBTyx3QkFBd0IsY0FBYztBQUM3QyxPQUFPLHFCQUFxQixvQkFBb0I7QUFDaEQsT0FBTyxzQkFBc0IscUJBQXFCO0FBQ2xELE9BQU8scUJBQXFCLG9CQUFvQjtBQUNoRCxPQUFPLG9CQUFvQixtQkFBbUI7QUFDOUMsT0FBTyxxQkFBcUIsb0JBQW9CO0FBQ2hELE9BQU8sOEJBQThCLDZCQUE2QjtBQUNsRSxPQUFPLDRCQUE0QiwyQkFBMkI7QUFDOUQsT0FBTyx1QkFBdUIsc0JBQXNCO0FBQ3BELE9BQU8sb0JBQW9CLG1CQUFtQjtBQUM5QyxPQUFPLHFCQUFxQixvQkFBb0I7QUFDaEQsT0FBTyxzQkFBc0IsWUFBWSxRQUFRLHVCQUF1QjtBQUV4RSxTQUFTLE9BQU8sUUFBUSxvQkFBb0I7QUFDNUMsT0FBTyxvQkFBb0Isc0JBQXNCO0FBQ2pELE9BQU8sMEJBQTBCLGlCQUFpQixRQUFRLG1CQUFtQjtBQUU3RSxlQUFlLGVBQWUsVUFBVSxPQUF1QjtFQUM5RCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDbkIsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLFFBQVEsT0FBTztFQUNsQyxNQUFNLEdBQUcsVUFBVSxHQUFHLE9BQU8sS0FBSyxDQUFDO0VBRW5DLElBQUk7SUFDSCxrRkFBa0Y7SUFDbEYsSUFBSSxjQUFjLGFBQWE7TUFDOUIsT0FBTyxNQUFNO0lBQ2Q7SUFFQSxPQUFPLEtBQUssQ0FBQztNQUFFLEtBQUssQ0FBQywyQkFBMkIsQ0FBQztNQUFFO0lBQVU7SUFFN0QsTUFBTSxlQUFlLENBQUM7TUFDckIsSUFBSSxrQkFBa0IsY0FBYztRQUNuQyxPQUFPLEtBQUssQ0FBQztVQUNaLEtBQUssQ0FBQyxDQUFDLEVBQUUsVUFBVSxtQkFBbUIsQ0FBQztVQUN2QztVQUNBLEtBQUs7VUFDTCxjQUFjLE9BQU8sT0FBTztRQUM3QjtNQUNELE9BQU87UUFDTixPQUFPLEtBQUssQ0FBQztVQUNaLEtBQUssQ0FBQyxDQUFDLEVBQUUsVUFBVSx5Q0FBeUMsQ0FBQztVQUM3RDtVQUNBO1FBQ0Q7TUFDRDtNQUVBLE9BQU87SUFDUjtJQUVBLElBQUksU0FBc0Q7SUFFMUQsSUFBSSxRQUFRLFdBQVcsZUFBZTtNQUNyQyxTQUFTLG1CQUFtQjtJQUM3QixPQUFPLElBQUksUUFBUSxXQUFXLG9CQUFvQjtNQUNqRCxTQUFTLHVCQUF1QjtJQUNqQyxPQUFPLElBQUksVUFBVSxVQUFVLENBQUMsWUFBWSxVQUFVLFVBQVUsQ0FBQyxZQUFZO01BQzVFLFNBQVMsZUFBZTtJQUN6QjtJQUVBLE9BQVE7TUFDUCxLQUFLO1FBQ0osU0FBUyxtQkFBbUI7UUFDNUI7TUFDRCxLQUFLO1FBQ0osU0FBUyxpQkFBaUI7UUFDMUI7TUFDRCxLQUFLO1FBQ0osU0FBUyxnQkFBZ0I7UUFDekI7TUFDRCxLQUFLO1FBQ0osU0FBUyxlQUFlO1FBQ3hCO01BQ0QsS0FBSztRQUNKLFNBQVMsZ0JBQWdCO1FBQ3pCO01BQ0QsS0FBSztRQUNKLFNBQVMsZ0JBQWdCO1FBQ3pCO01BQ0QsS0FBSztRQUNKLFNBQVMsa0JBQWtCO1FBQzNCO01BQ0QsS0FBSztRQUNKLFNBQVMseUJBQXlCO1FBQ2xDO01BQ0QsS0FBSztRQUNKLFNBQVMsdUJBQXVCO1FBQ2hDO01BQ0QsS0FBSztRQUNKLFNBQVMsZUFBZTtRQUN4QjtJQUNGO0lBRUEsSUFBSSxPQUFPLFdBQVcsYUFBYTtNQUNsQyxNQUFNLElBQUksYUFBYSxDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMxRDtJQUVBLE9BQU8sTUFBTSxPQUFPLElBQUksQ0FBQztFQUMxQixFQUFFLE9BQU8sR0FBWTtJQUNwQixJQUFJLENBQUMsQ0FBQyxhQUFhLEtBQUssR0FBRztNQUMxQixPQUFPLElBQUksYUFBYSxpQkFBaUIsQ0FBQyxPQUFPO0lBQ2xEO0lBRUEsSUFBSyxFQUFFLEtBQUssRUFBYSxTQUFTLHVCQUF1QjtNQUN4RCxPQUFPLGFBQWEsYUFBYSxDQUFDO0lBQ25DO0lBRUEsSUFBSyxFQUFFLEtBQUssRUFBYSxTQUFTLGdCQUFnQjtNQUNqRCxPQUFPLGFBQWEsYUFBYSxDQUFDO1FBQUUsU0FBUztNQUFrQjtJQUNoRTtJQUVBLE9BQU8sSUFBSSxhQUFhLEVBQUUsT0FBTyxFQUFFLENBQUMsT0FBTztFQUM1QztBQUNEIn0=
// denoCacheMetadata=12612797679685854046,13844897365285184743