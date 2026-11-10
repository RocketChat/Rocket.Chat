import { JsonRpcError } from 'jsonrpc-lite';
import handleConstructApp from './construct.ts';
import handleInitialize from './handleInitialize.ts';
import handleGetStatus from './handleGetStatus.ts';
import handleSetStatus from './handleSetStatus.ts';
import handleOnEnable from './handleOnEnable.ts';
import handleOnInstall from './handleOnInstall.ts';
import handleOnDisable from './handleOnDisable.ts';
import handleOnUninstall from './handleOnUninstall.ts';
import handleOnPreSettingUpdate from './handleOnPreSettingUpdate.ts';
import handleOnSettingUpdated from './handleOnSettingUpdated.ts';
import handleOnUpdate from './handleOnUpdate.ts';
import handleUploadEvents, { uploadEvents } from './handleUploadEvents.ts';
import { isOneOf } from '../lib/assertions.ts';
import handleListener from '../listener/handler.ts';
import handleUIKitInteraction, { uikitInteractions } from '../uikit/handler.ts';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9oYW5kbGVycy9hcHAvaGFuZGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEZWZpbmVkLCBKc29uUnBjRXJyb3IgfSBmcm9tICdqc29ucnBjLWxpdGUnO1xuXG5pbXBvcnQgaGFuZGxlQ29uc3RydWN0QXBwIGZyb20gJy4vY29uc3RydWN0LnRzJztcbmltcG9ydCBoYW5kbGVJbml0aWFsaXplIGZyb20gJy4vaGFuZGxlSW5pdGlhbGl6ZS50cyc7XG5pbXBvcnQgaGFuZGxlR2V0U3RhdHVzIGZyb20gJy4vaGFuZGxlR2V0U3RhdHVzLnRzJztcbmltcG9ydCBoYW5kbGVTZXRTdGF0dXMgZnJvbSAnLi9oYW5kbGVTZXRTdGF0dXMudHMnO1xuaW1wb3J0IGhhbmRsZU9uRW5hYmxlIGZyb20gJy4vaGFuZGxlT25FbmFibGUudHMnO1xuaW1wb3J0IGhhbmRsZU9uSW5zdGFsbCBmcm9tICcuL2hhbmRsZU9uSW5zdGFsbC50cyc7XG5pbXBvcnQgaGFuZGxlT25EaXNhYmxlIGZyb20gJy4vaGFuZGxlT25EaXNhYmxlLnRzJztcbmltcG9ydCBoYW5kbGVPblVuaW5zdGFsbCBmcm9tICcuL2hhbmRsZU9uVW5pbnN0YWxsLnRzJztcbmltcG9ydCBoYW5kbGVPblByZVNldHRpbmdVcGRhdGUgZnJvbSAnLi9oYW5kbGVPblByZVNldHRpbmdVcGRhdGUudHMnO1xuaW1wb3J0IGhhbmRsZU9uU2V0dGluZ1VwZGF0ZWQgZnJvbSAnLi9oYW5kbGVPblNldHRpbmdVcGRhdGVkLnRzJztcbmltcG9ydCBoYW5kbGVPblVwZGF0ZSBmcm9tICcuL2hhbmRsZU9uVXBkYXRlLnRzJztcbmltcG9ydCBoYW5kbGVVcGxvYWRFdmVudHMsIHsgdXBsb2FkRXZlbnRzIH0gZnJvbSAnLi9oYW5kbGVVcGxvYWRFdmVudHMudHMnO1xuaW1wb3J0IHsgaXNPbmVPZiB9IGZyb20gJy4uL2xpYi9hc3NlcnRpb25zLnRzJztcbmltcG9ydCBoYW5kbGVMaXN0ZW5lciBmcm9tICcuLi9saXN0ZW5lci9oYW5kbGVyLnRzJztcbmltcG9ydCBoYW5kbGVVSUtpdEludGVyYWN0aW9uLCB7IHVpa2l0SW50ZXJhY3Rpb25zIH0gZnJvbSAnLi4vdWlraXQvaGFuZGxlci50cyc7XG5pbXBvcnQgeyBSZXF1ZXN0Q29udGV4dCB9IGZyb20gJy4uLy4uL2xpYi9yZXF1ZXN0Q29udGV4dC50cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUFwcChyZXF1ZXN0OiBSZXF1ZXN0Q29udGV4dCk6IFByb21pc2U8RGVmaW5lZCB8IEpzb25ScGNFcnJvcj4ge1xuXHRjb25zdCB7IG1ldGhvZCB9ID0gcmVxdWVzdDtcblx0Y29uc3QgeyBsb2dnZXIgfSA9IHJlcXVlc3QuY29udGV4dDtcblx0Y29uc3QgWywgYXBwTWV0aG9kXSA9IG1ldGhvZC5zcGxpdCgnOicpO1xuXG5cdHRyeSB7XG5cdFx0Ly8gV2UgZG9uJ3Qgd2FudCB0aGUgZ2V0U3RhdHVzIG1ldGhvZCB0byBnZW5lcmF0ZSBsb2dzLCBzbyB3ZSBoYW5kbGUgaXQgc2VwYXJhdGVseVxuXHRcdGlmIChhcHBNZXRob2QgPT09ICdnZXRTdGF0dXMnKSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgaGFuZGxlR2V0U3RhdHVzKCk7XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLmRlYnVnKHsgbXNnOiBgQSBtZXRob2QgaXMgYmVpbmcgY2FsbGVkLi4uYCwgYXBwTWV0aG9kIH0pO1xuXG5cdFx0Y29uc3QgZm9ybWF0UmVzdWx0ID0gKHJlc3VsdDogRGVmaW5lZCB8IEpzb25ScGNFcnJvcik6IERlZmluZWQgfCBKc29uUnBjRXJyb3IgPT4ge1xuXHRcdFx0aWYgKHJlc3VsdCBpbnN0YW5jZW9mIEpzb25ScGNFcnJvcikge1xuXHRcdFx0XHRsb2dnZXIuZGVidWcoe1xuXHRcdFx0XHRcdG1zZzogYCcke2FwcE1ldGhvZH0nIHdhcyB1bnN1Y2Nlc3NmdWwuYCxcblx0XHRcdFx0XHRhcHBNZXRob2QsXG5cdFx0XHRcdFx0ZXJyOiByZXN1bHQsXG5cdFx0XHRcdFx0ZXJyb3JNZXNzYWdlOiByZXN1bHQubWVzc2FnZSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsb2dnZXIuZGVidWcoe1xuXHRcdFx0XHRcdG1zZzogYCcke2FwcE1ldGhvZH0nIHdhcyBzdWNjZXNzZnVsbHkgY2FsbGVkISBUaGUgcmVzdWx0IGlzOmAsXG5cdFx0XHRcdFx0YXBwTWV0aG9kLFxuXHRcdFx0XHRcdHJlc3VsdCxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fTtcblxuXHRcdGxldCByZXN1bHQ6IFByb21pc2U8RGVmaW5lZCB8IEpzb25ScGNFcnJvcj4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cblx0XHRpZiAoaXNPbmVPZihhcHBNZXRob2QsIHVwbG9hZEV2ZW50cykpIHtcblx0XHRcdHJlc3VsdCA9IGhhbmRsZVVwbG9hZEV2ZW50cyhyZXF1ZXN0KTtcblx0XHR9IGVsc2UgaWYgKGlzT25lT2YoYXBwTWV0aG9kLCB1aWtpdEludGVyYWN0aW9ucykpIHtcblx0XHRcdHJlc3VsdCA9IGhhbmRsZVVJS2l0SW50ZXJhY3Rpb24ocmVxdWVzdCk7XG5cdFx0fSBlbHNlIGlmIChhcHBNZXRob2Quc3RhcnRzV2l0aCgnY2hlY2snKSB8fCBhcHBNZXRob2Quc3RhcnRzV2l0aCgnZXhlY3V0ZScpKSB7XG5cdFx0XHRyZXN1bHQgPSBoYW5kbGVMaXN0ZW5lcihyZXF1ZXN0KTtcblx0XHR9XG5cblx0XHRzd2l0Y2ggKGFwcE1ldGhvZCkge1xuXHRcdFx0Y2FzZSAnY29uc3RydWN0Jzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlQ29uc3RydWN0QXBwKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2luaXRpYWxpemUnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVJbml0aWFsaXplKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3NldFN0YXR1cyc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZVNldFN0YXR1cyhyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdvbkVuYWJsZSc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZU9uRW5hYmxlKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ29uRGlzYWJsZSc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZU9uRGlzYWJsZShyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdvbkluc3RhbGwnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVPbkluc3RhbGwocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnb25Vbmluc3RhbGwnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVPblVuaW5zdGFsbChyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdvblByZVNldHRpbmdVcGRhdGUnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVPblByZVNldHRpbmdVcGRhdGUocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnb25TZXR0aW5nVXBkYXRlZCc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZU9uU2V0dGluZ1VwZGF0ZWQocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnb25VcGRhdGUnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVPblVwZGF0ZShyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHR0aHJvdyBuZXcgSnNvblJwY0Vycm9yKGBVbmtub3duIG1ldGhvZCBcIiR7YXBwTWV0aG9kfVwiYCwgLTMyNjAxKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXdhaXQgcmVzdWx0LnRoZW4oZm9ybWF0UmVzdWx0KTtcblx0fSBjYXRjaCAoZTogdW5rbm93bikge1xuXHRcdGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikpIHtcblx0XHRcdHJldHVybiBuZXcgSnNvblJwY0Vycm9yKCdVbmtub3duIGVycm9yJywgLTMyMDAwLCBlKTtcblx0XHR9XG5cblx0XHRpZiAoKGUuY2F1c2UgYXMgc3RyaW5nKT8uaW5jbHVkZXMoJ2ludmFsaWRfcGFyYW1fdHlwZScpKSB7XG5cdFx0XHRyZXR1cm4gSnNvblJwY0Vycm9yLmludmFsaWRQYXJhbXMobnVsbCk7XG5cdFx0fVxuXG5cdFx0aWYgKChlLmNhdXNlIGFzIHN0cmluZyk/LmluY2x1ZGVzKCdpbnZhbGlkX2FwcCcpKSB7XG5cdFx0XHRyZXR1cm4gSnNvblJwY0Vycm9yLmludGVybmFsRXJyb3IoeyBtZXNzYWdlOiAnQXBwIHVuYXZhaWxhYmxlJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3IEpzb25ScGNFcnJvcihlLm1lc3NhZ2UsIC0zMjAwMCwgZSk7XG5cdH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFrQixZQUFZLFFBQVEsZUFBZTtBQUVyRCxPQUFPLHdCQUF3QixpQkFBaUI7QUFDaEQsT0FBTyxzQkFBc0Isd0JBQXdCO0FBQ3JELE9BQU8scUJBQXFCLHVCQUF1QjtBQUNuRCxPQUFPLHFCQUFxQix1QkFBdUI7QUFDbkQsT0FBTyxvQkFBb0Isc0JBQXNCO0FBQ2pELE9BQU8scUJBQXFCLHVCQUF1QjtBQUNuRCxPQUFPLHFCQUFxQix1QkFBdUI7QUFDbkQsT0FBTyx1QkFBdUIseUJBQXlCO0FBQ3ZELE9BQU8sOEJBQThCLGdDQUFnQztBQUNyRSxPQUFPLDRCQUE0Qiw4QkFBOEI7QUFDakUsT0FBTyxvQkFBb0Isc0JBQXNCO0FBQ2pELE9BQU8sc0JBQXNCLFlBQVksUUFBUSwwQkFBMEI7QUFDM0UsU0FBUyxPQUFPLFFBQVEsdUJBQXVCO0FBQy9DLE9BQU8sb0JBQW9CLHlCQUF5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
// denoCacheMetadata=457656536941250483,1066375061851128515