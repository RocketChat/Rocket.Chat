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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdmFyL2ZvbGRlcnMvcHQvNnBqM3hjMzk3ZzkxZF9qa3F6eDdtbmp3MDAwMGduL1QvYXBwcy1lbmdpbmUtdGVtcC9kZW5vLXJ1bnRpbWUvaGFuZGxlcnMvYXBwL2hhbmRsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGVmaW5lZCwgSnNvblJwY0Vycm9yIH0gZnJvbSAnanNvbnJwYy1saXRlJztcblxuaW1wb3J0IGhhbmRsZUNvbnN0cnVjdEFwcCBmcm9tICcuL2NvbnN0cnVjdC50cyc7XG5pbXBvcnQgaGFuZGxlSW5pdGlhbGl6ZSBmcm9tICcuL2hhbmRsZUluaXRpYWxpemUudHMnO1xuaW1wb3J0IGhhbmRsZUdldFN0YXR1cyBmcm9tICcuL2hhbmRsZUdldFN0YXR1cy50cyc7XG5pbXBvcnQgaGFuZGxlU2V0U3RhdHVzIGZyb20gJy4vaGFuZGxlU2V0U3RhdHVzLnRzJztcbmltcG9ydCBoYW5kbGVPbkVuYWJsZSBmcm9tICcuL2hhbmRsZU9uRW5hYmxlLnRzJztcbmltcG9ydCBoYW5kbGVPbkluc3RhbGwgZnJvbSAnLi9oYW5kbGVPbkluc3RhbGwudHMnO1xuaW1wb3J0IGhhbmRsZU9uRGlzYWJsZSBmcm9tICcuL2hhbmRsZU9uRGlzYWJsZS50cyc7XG5pbXBvcnQgaGFuZGxlT25Vbmluc3RhbGwgZnJvbSAnLi9oYW5kbGVPblVuaW5zdGFsbC50cyc7XG5pbXBvcnQgaGFuZGxlT25QcmVTZXR0aW5nVXBkYXRlIGZyb20gJy4vaGFuZGxlT25QcmVTZXR0aW5nVXBkYXRlLnRzJztcbmltcG9ydCBoYW5kbGVPblNldHRpbmdVcGRhdGVkIGZyb20gJy4vaGFuZGxlT25TZXR0aW5nVXBkYXRlZC50cyc7XG5pbXBvcnQgaGFuZGxlT25VcGRhdGUgZnJvbSAnLi9oYW5kbGVPblVwZGF0ZS50cyc7XG5pbXBvcnQgaGFuZGxlVXBsb2FkRXZlbnRzLCB7IHVwbG9hZEV2ZW50cyB9IGZyb20gJy4vaGFuZGxlVXBsb2FkRXZlbnRzLnRzJztcbmltcG9ydCB7IGlzT25lT2YgfSBmcm9tICcuLi9saWIvYXNzZXJ0aW9ucy50cyc7XG5pbXBvcnQgaGFuZGxlTGlzdGVuZXIgZnJvbSAnLi4vbGlzdGVuZXIvaGFuZGxlci50cyc7XG5pbXBvcnQgaGFuZGxlVUlLaXRJbnRlcmFjdGlvbiwgeyB1aWtpdEludGVyYWN0aW9ucyB9IGZyb20gJy4uL3Vpa2l0L2hhbmRsZXIudHMnO1xuaW1wb3J0IHsgUmVxdWVzdENvbnRleHQgfSBmcm9tICcuLi8uLi9saWIvcmVxdWVzdENvbnRleHQudHMnO1xuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVBcHAocmVxdWVzdDogUmVxdWVzdENvbnRleHQpOiBQcm9taXNlPERlZmluZWQgfCBKc29uUnBjRXJyb3I+IHtcblx0Y29uc3QgeyBtZXRob2QgfSA9IHJlcXVlc3Q7XG5cdGNvbnN0IHsgbG9nZ2VyIH0gPSByZXF1ZXN0LmNvbnRleHQ7XG5cdGNvbnN0IFssIGFwcE1ldGhvZF0gPSBtZXRob2Quc3BsaXQoJzonKTtcblxuXHR0cnkge1xuXHRcdC8vIFdlIGRvbid0IHdhbnQgdGhlIGdldFN0YXR1cyBtZXRob2QgdG8gZ2VuZXJhdGUgbG9ncywgc28gd2UgaGFuZGxlIGl0IHNlcGFyYXRlbHlcblx0XHRpZiAoYXBwTWV0aG9kID09PSAnZ2V0U3RhdHVzJykge1xuXHRcdFx0cmV0dXJuIGF3YWl0IGhhbmRsZUdldFN0YXR1cygpO1xuXHRcdH1cblxuXHRcdGxvZ2dlci5kZWJ1Zyh7IG1zZzogYEEgbWV0aG9kIGlzIGJlaW5nIGNhbGxlZC4uLmAsIGFwcE1ldGhvZCB9KTtcblxuXHRcdGNvbnN0IGZvcm1hdFJlc3VsdCA9IChyZXN1bHQ6IERlZmluZWQgfCBKc29uUnBjRXJyb3IpOiBEZWZpbmVkIHwgSnNvblJwY0Vycm9yID0+IHtcblx0XHRcdGlmIChyZXN1bHQgaW5zdGFuY2VvZiBKc29uUnBjRXJyb3IpIHtcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKHtcblx0XHRcdFx0XHRtc2c6IGAnJHthcHBNZXRob2R9JyB3YXMgdW5zdWNjZXNzZnVsLmAsXG5cdFx0XHRcdFx0YXBwTWV0aG9kLFxuXHRcdFx0XHRcdGVycjogcmVzdWx0LFxuXHRcdFx0XHRcdGVycm9yTWVzc2FnZTogcmVzdWx0Lm1lc3NhZ2UsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKHtcblx0XHRcdFx0XHRtc2c6IGAnJHthcHBNZXRob2R9JyB3YXMgc3VjY2Vzc2Z1bGx5IGNhbGxlZCEgVGhlIHJlc3VsdCBpczpgLFxuXHRcdFx0XHRcdGFwcE1ldGhvZCxcblx0XHRcdFx0XHRyZXN1bHQsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cblx0XHRsZXQgcmVzdWx0OiBQcm9taXNlPERlZmluZWQgfCBKc29uUnBjRXJyb3I+IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG5cdFx0aWYgKGlzT25lT2YoYXBwTWV0aG9kLCB1cGxvYWRFdmVudHMpKSB7XG5cdFx0XHRyZXN1bHQgPSBoYW5kbGVVcGxvYWRFdmVudHMocmVxdWVzdCk7XG5cdFx0fSBlbHNlIGlmIChpc09uZU9mKGFwcE1ldGhvZCwgdWlraXRJbnRlcmFjdGlvbnMpKSB7XG5cdFx0XHRyZXN1bHQgPSBoYW5kbGVVSUtpdEludGVyYWN0aW9uKHJlcXVlc3QpO1xuXHRcdH0gZWxzZSBpZiAoYXBwTWV0aG9kLnN0YXJ0c1dpdGgoJ2NoZWNrJykgfHwgYXBwTWV0aG9kLnN0YXJ0c1dpdGgoJ2V4ZWN1dGUnKSkge1xuXHRcdFx0cmVzdWx0ID0gaGFuZGxlTGlzdGVuZXIocmVxdWVzdCk7XG5cdFx0fVxuXG5cdFx0c3dpdGNoIChhcHBNZXRob2QpIHtcblx0XHRcdGNhc2UgJ2NvbnN0cnVjdCc6XG5cdFx0XHRcdHJlc3VsdCA9IGhhbmRsZUNvbnN0cnVjdEFwcChyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdpbml0aWFsaXplJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlSW5pdGlhbGl6ZShyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdzZXRTdGF0dXMnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVTZXRTdGF0dXMocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnb25FbmFibGUnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVPbkVuYWJsZShyZXF1ZXN0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdvbkRpc2FibGUnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVPbkRpc2FibGUocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnb25JbnN0YWxsJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlT25JbnN0YWxsKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ29uVW5pbnN0YWxsJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlT25Vbmluc3RhbGwocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnb25QcmVTZXR0aW5nVXBkYXRlJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlT25QcmVTZXR0aW5nVXBkYXRlKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ29uU2V0dGluZ1VwZGF0ZWQnOlxuXHRcdFx0XHRyZXN1bHQgPSBoYW5kbGVPblNldHRpbmdVcGRhdGVkKHJlcXVlc3QpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ29uVXBkYXRlJzpcblx0XHRcdFx0cmVzdWx0ID0gaGFuZGxlT25VcGRhdGUocmVxdWVzdCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0dGhyb3cgbmV3IEpzb25ScGNFcnJvcihgVW5rbm93biBtZXRob2QgXCIke2FwcE1ldGhvZH1cImAsIC0zMjYwMSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF3YWl0IHJlc3VsdC50aGVuKGZvcm1hdFJlc3VsdCk7XG5cdH0gY2F0Y2ggKGU6IHVua25vd24pIHtcblx0XHRpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IEpzb25ScGNFcnJvcignVW5rbm93biBlcnJvcicsIC0zMjAwMCwgZSk7XG5cdFx0fVxuXG5cdFx0aWYgKChlLmNhdXNlIGFzIHN0cmluZyk/LmluY2x1ZGVzKCdpbnZhbGlkX3BhcmFtX3R5cGUnKSkge1xuXHRcdFx0cmV0dXJuIEpzb25ScGNFcnJvci5pbnZhbGlkUGFyYW1zKG51bGwpO1xuXHRcdH1cblxuXHRcdGlmICgoZS5jYXVzZSBhcyBzdHJpbmcpPy5pbmNsdWRlcygnaW52YWxpZF9hcHAnKSkge1xuXHRcdFx0cmV0dXJuIEpzb25ScGNFcnJvci5pbnRlcm5hbEVycm9yKHsgbWVzc2FnZTogJ0FwcCB1bmF2YWlsYWJsZScgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBKc29uUnBjRXJyb3IoZS5tZXNzYWdlLCAtMzIwMDAsIGUpO1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBa0IsWUFBWSxRQUFRLGVBQWU7QUFFckQsT0FBTyx3QkFBd0IsaUJBQWlCO0FBQ2hELE9BQU8sc0JBQXNCLHdCQUF3QjtBQUNyRCxPQUFPLHFCQUFxQix1QkFBdUI7QUFDbkQsT0FBTyxxQkFBcUIsdUJBQXVCO0FBQ25ELE9BQU8sb0JBQW9CLHNCQUFzQjtBQUNqRCxPQUFPLHFCQUFxQix1QkFBdUI7QUFDbkQsT0FBTyxxQkFBcUIsdUJBQXVCO0FBQ25ELE9BQU8sdUJBQXVCLHlCQUF5QjtBQUN2RCxPQUFPLDhCQUE4QixnQ0FBZ0M7QUFDckUsT0FBTyw0QkFBNEIsOEJBQThCO0FBQ2pFLE9BQU8sb0JBQW9CLHNCQUFzQjtBQUNqRCxPQUFPLHNCQUFzQixZQUFZLFFBQVEsMEJBQTBCO0FBQzNFLFNBQVMsT0FBTyxRQUFRLHVCQUF1QjtBQUMvQyxPQUFPLG9CQUFv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
// denoCacheMetadata=457656536941250483,6115977801434448849