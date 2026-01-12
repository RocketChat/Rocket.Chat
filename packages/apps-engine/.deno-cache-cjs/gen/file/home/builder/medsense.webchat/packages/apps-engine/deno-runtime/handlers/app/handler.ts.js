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
import handleListener from '../listener/handler.ts';
import handleUIKitInteraction, { uikitInteractions } from '../uikit/handler.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import handleOnUpdate from './handleOnUpdate.ts';
export default async function handleApp(method, params) {
  const [, appMethod] = method.split(':');
  try {
    // We don't want the getStatus method to generate logs, so we handle it separately
    if (appMethod === 'getStatus') {
      return await handleGetStatus();
    }
    // `app` will be undefined if the method here is "app:construct"
    const app = AppObjectRegistry.get('app');
    app?.getLogger().debug(`'${appMethod}' is being called...`);
    if (uikitInteractions.includes(appMethod)) {
      return handleUIKitInteraction(appMethod, params).then((result)=>{
        if (result instanceof JsonRpcError) {
          app?.getLogger().debug(`'${appMethod}' was unsuccessful.`, result.message);
        } else {
          app?.getLogger().debug(`'${appMethod}' was successfully called! The result is:`, result);
        }
        return result;
      });
    }
    if (appMethod.startsWith('check') || appMethod.startsWith('execute')) {
      return handleListener(appMethod, params).then((result)=>{
        if (result instanceof JsonRpcError) {
          app?.getLogger().debug(`'${appMethod}' was unsuccessful.`, result.message);
        } else {
          app?.getLogger().debug(`'${appMethod}' was successfully called! The result is:`, result);
        }
        return result;
      });
    }
    let result;
    switch(appMethod){
      case 'construct':
        result = await handleConstructApp(params);
        break;
      case 'initialize':
        result = await handleInitialize();
        break;
      case 'setStatus':
        result = await handleSetStatus(params);
        break;
      case 'onEnable':
        result = await handleOnEnable();
        break;
      case 'onDisable':
        result = await handleOnDisable();
        break;
      case 'onInstall':
        result = await handleOnInstall(params);
        break;
      case 'onUninstall':
        result = await handleOnUninstall(params);
        break;
      case 'onPreSettingUpdate':
        result = await handleOnPreSettingUpdate(params);
        break;
      case 'onSettingUpdated':
        result = await handleOnSettingUpdated(params);
        break;
      case 'onUpdate':
        result = await handleOnUpdate(params);
        break;
      default:
        throw new JsonRpcError('Method not found', -32601);
    }
    app?.getLogger().debug(`'${appMethod}' was successfully called! The result is:`, result);
    return result;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9idWlsZGVyL21lZHNlbnNlLndlYmNoYXQvcGFja2FnZXMvYXBwcy1lbmdpbmUvZGVuby1ydW50aW1lL2hhbmRsZXJzL2FwcC9oYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQXBwIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vQXBwLnRzJztcclxuaW1wb3J0IHsgRGVmaW5lZCwgSnNvblJwY0Vycm9yIH0gZnJvbSAnanNvbnJwYy1saXRlJztcclxuXHJcbmltcG9ydCBoYW5kbGVDb25zdHJ1Y3RBcHAgZnJvbSAnLi9jb25zdHJ1Y3QudHMnO1xyXG5pbXBvcnQgaGFuZGxlSW5pdGlhbGl6ZSBmcm9tICcuL2hhbmRsZUluaXRpYWxpemUudHMnO1xyXG5pbXBvcnQgaGFuZGxlR2V0U3RhdHVzIGZyb20gJy4vaGFuZGxlR2V0U3RhdHVzLnRzJztcclxuaW1wb3J0IGhhbmRsZVNldFN0YXR1cyBmcm9tICcuL2hhbmRsZVNldFN0YXR1cy50cyc7XHJcbmltcG9ydCBoYW5kbGVPbkVuYWJsZSBmcm9tICcuL2hhbmRsZU9uRW5hYmxlLnRzJztcclxuaW1wb3J0IGhhbmRsZU9uSW5zdGFsbCBmcm9tICcuL2hhbmRsZU9uSW5zdGFsbC50cyc7XHJcbmltcG9ydCBoYW5kbGVPbkRpc2FibGUgZnJvbSAnLi9oYW5kbGVPbkRpc2FibGUudHMnO1xyXG5pbXBvcnQgaGFuZGxlT25Vbmluc3RhbGwgZnJvbSAnLi9oYW5kbGVPblVuaW5zdGFsbC50cyc7XHJcbmltcG9ydCBoYW5kbGVPblByZVNldHRpbmdVcGRhdGUgZnJvbSAnLi9oYW5kbGVPblByZVNldHRpbmdVcGRhdGUudHMnO1xyXG5pbXBvcnQgaGFuZGxlT25TZXR0aW5nVXBkYXRlZCBmcm9tICcuL2hhbmRsZU9uU2V0dGluZ1VwZGF0ZWQudHMnO1xyXG5pbXBvcnQgaGFuZGxlTGlzdGVuZXIgZnJvbSAnLi4vbGlzdGVuZXIvaGFuZGxlci50cyc7XHJcbmltcG9ydCBoYW5kbGVVSUtpdEludGVyYWN0aW9uLCB7IHVpa2l0SW50ZXJhY3Rpb25zIH0gZnJvbSAnLi4vdWlraXQvaGFuZGxlci50cyc7XHJcbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xyXG5pbXBvcnQgaGFuZGxlT25VcGRhdGUgZnJvbSAnLi9oYW5kbGVPblVwZGF0ZS50cyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVBcHAobWV0aG9kOiBzdHJpbmcsIHBhcmFtczogdW5rbm93bik6IFByb21pc2U8RGVmaW5lZCB8IEpzb25ScGNFcnJvcj4ge1xyXG5cdGNvbnN0IFssIGFwcE1ldGhvZF0gPSBtZXRob2Quc3BsaXQoJzonKTtcclxuXHJcblx0dHJ5IHtcclxuXHRcdC8vIFdlIGRvbid0IHdhbnQgdGhlIGdldFN0YXR1cyBtZXRob2QgdG8gZ2VuZXJhdGUgbG9ncywgc28gd2UgaGFuZGxlIGl0IHNlcGFyYXRlbHlcclxuXHRcdGlmIChhcHBNZXRob2QgPT09ICdnZXRTdGF0dXMnKSB7XHJcblx0XHRcdHJldHVybiBhd2FpdCBoYW5kbGVHZXRTdGF0dXMoKTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBgYXBwYCB3aWxsIGJlIHVuZGVmaW5lZCBpZiB0aGUgbWV0aG9kIGhlcmUgaXMgXCJhcHA6Y29uc3RydWN0XCJcclxuXHRcdGNvbnN0IGFwcCA9IEFwcE9iamVjdFJlZ2lzdHJ5LmdldDxBcHA+KCdhcHAnKTtcclxuXHJcblx0XHRhcHA/LmdldExvZ2dlcigpLmRlYnVnKGAnJHthcHBNZXRob2R9JyBpcyBiZWluZyBjYWxsZWQuLi5gKTtcclxuXHJcblx0XHRpZiAodWlraXRJbnRlcmFjdGlvbnMuaW5jbHVkZXMoYXBwTWV0aG9kKSkge1xyXG5cdFx0XHRyZXR1cm4gaGFuZGxlVUlLaXRJbnRlcmFjdGlvbihhcHBNZXRob2QsIHBhcmFtcykudGhlbigocmVzdWx0KSA9PiB7XHJcblx0XHRcdFx0aWYgKHJlc3VsdCBpbnN0YW5jZW9mIEpzb25ScGNFcnJvcikge1xyXG5cdFx0XHRcdFx0YXBwPy5nZXRMb2dnZXIoKS5kZWJ1ZyhgJyR7YXBwTWV0aG9kfScgd2FzIHVuc3VjY2Vzc2Z1bC5gLCByZXN1bHQubWVzc2FnZSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGFwcD8uZ2V0TG9nZ2VyKCkuZGVidWcoYCcke2FwcE1ldGhvZH0nIHdhcyBzdWNjZXNzZnVsbHkgY2FsbGVkISBUaGUgcmVzdWx0IGlzOmAsIHJlc3VsdCk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoYXBwTWV0aG9kLnN0YXJ0c1dpdGgoJ2NoZWNrJykgfHwgYXBwTWV0aG9kLnN0YXJ0c1dpdGgoJ2V4ZWN1dGUnKSkge1xyXG5cdFx0XHRyZXR1cm4gaGFuZGxlTGlzdGVuZXIoYXBwTWV0aG9kLCBwYXJhbXMpLnRoZW4oKHJlc3VsdCkgPT4ge1xyXG5cdFx0XHRcdGlmIChyZXN1bHQgaW5zdGFuY2VvZiBKc29uUnBjRXJyb3IpIHtcclxuXHRcdFx0XHRcdGFwcD8uZ2V0TG9nZ2VyKCkuZGVidWcoYCcke2FwcE1ldGhvZH0nIHdhcyB1bnN1Y2Nlc3NmdWwuYCwgcmVzdWx0Lm1lc3NhZ2UpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRhcHA/LmdldExvZ2dlcigpLmRlYnVnKGAnJHthcHBNZXRob2R9JyB3YXMgc3VjY2Vzc2Z1bGx5IGNhbGxlZCEgVGhlIHJlc3VsdCBpczpgLCByZXN1bHQpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHJlc3VsdDogRGVmaW5lZCB8IEpzb25ScGNFcnJvcjtcclxuXHJcblx0XHRzd2l0Y2ggKGFwcE1ldGhvZCkge1xyXG5cdFx0XHRjYXNlICdjb25zdHJ1Y3QnOlxyXG5cdFx0XHRcdHJlc3VsdCA9IGF3YWl0IGhhbmRsZUNvbnN0cnVjdEFwcChwYXJhbXMpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdpbml0aWFsaXplJzpcclxuXHRcdFx0XHRyZXN1bHQgPSBhd2FpdCBoYW5kbGVJbml0aWFsaXplKCk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ3NldFN0YXR1cyc6XHJcblx0XHRcdFx0cmVzdWx0ID0gYXdhaXQgaGFuZGxlU2V0U3RhdHVzKHBhcmFtcyk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ29uRW5hYmxlJzpcclxuXHRcdFx0XHRyZXN1bHQgPSBhd2FpdCBoYW5kbGVPbkVuYWJsZSgpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdvbkRpc2FibGUnOlxyXG5cdFx0XHRcdHJlc3VsdCA9IGF3YWl0IGhhbmRsZU9uRGlzYWJsZSgpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdvbkluc3RhbGwnOlxyXG5cdFx0XHRcdHJlc3VsdCA9IGF3YWl0IGhhbmRsZU9uSW5zdGFsbChwYXJhbXMpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdvblVuaW5zdGFsbCc6XHJcblx0XHRcdFx0cmVzdWx0ID0gYXdhaXQgaGFuZGxlT25Vbmluc3RhbGwocGFyYW1zKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnb25QcmVTZXR0aW5nVXBkYXRlJzpcclxuXHRcdFx0XHRyZXN1bHQgPSBhd2FpdCBoYW5kbGVPblByZVNldHRpbmdVcGRhdGUocGFyYW1zKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnb25TZXR0aW5nVXBkYXRlZCc6XHJcblx0XHRcdFx0cmVzdWx0ID0gYXdhaXQgaGFuZGxlT25TZXR0aW5nVXBkYXRlZChwYXJhbXMpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdvblVwZGF0ZSc6XHJcblx0XHRcdFx0cmVzdWx0ID0gYXdhaXQgaGFuZGxlT25VcGRhdGUocGFyYW1zKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHR0aHJvdyBuZXcgSnNvblJwY0Vycm9yKCdNZXRob2Qgbm90IGZvdW5kJywgLTMyNjAxKTtcclxuXHRcdH1cclxuXHJcblx0XHRhcHA/LmdldExvZ2dlcigpLmRlYnVnKGAnJHthcHBNZXRob2R9JyB3YXMgc3VjY2Vzc2Z1bGx5IGNhbGxlZCEgVGhlIHJlc3VsdCBpczpgLCByZXN1bHQpO1xyXG5cclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fSBjYXRjaCAoZTogdW5rbm93bikge1xyXG5cdFx0aWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xyXG5cdFx0XHRyZXR1cm4gbmV3IEpzb25ScGNFcnJvcignVW5rbm93biBlcnJvcicsIC0zMjAwMCwgZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKChlLmNhdXNlIGFzIHN0cmluZyk/LmluY2x1ZGVzKCdpbnZhbGlkX3BhcmFtX3R5cGUnKSkge1xyXG5cdFx0XHRyZXR1cm4gSnNvblJwY0Vycm9yLmludmFsaWRQYXJhbXMobnVsbCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKChlLmNhdXNlIGFzIHN0cmluZyk/LmluY2x1ZGVzKCdpbnZhbGlkX2FwcCcpKSB7XHJcblx0XHRcdHJldHVybiBKc29uUnBjRXJyb3IuaW50ZXJuYWxFcnJvcih7IG1lc3NhZ2U6ICdBcHAgdW5hdmFpbGFibGUnIH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBuZXcgSnNvblJwY0Vycm9yKGUubWVzc2FnZSwgLTMyMDAwLCBlKTtcclxuXHR9XHJcbn1cclxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQWtCLFlBQVksUUFBUSxlQUFlO0FBRXJELE9BQU8sd0JBQXdCLGlCQUFpQjtBQUNoRCxPQUFPLHNCQUFzQix3QkFBd0I7QUFDckQsT0FBTyxxQkFBcUIsdUJBQXVC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
// denoCacheMetadata=6917917426156363757,12481924172158148237