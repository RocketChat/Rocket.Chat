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
  // We don't want the getStatus method to generate logs, so we handle it separately
  if (appMethod === 'getStatus') {
    return handleGetStatus();
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
  try {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9oYW5kbGVycy9hcHAvaGFuZGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEFwcCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL0FwcC50cyc7XG5pbXBvcnQgeyBEZWZpbmVkLCBKc29uUnBjRXJyb3IgfSBmcm9tICdqc29ucnBjLWxpdGUnO1xuXG5pbXBvcnQgaGFuZGxlQ29uc3RydWN0QXBwIGZyb20gJy4vY29uc3RydWN0LnRzJztcbmltcG9ydCBoYW5kbGVJbml0aWFsaXplIGZyb20gJy4vaGFuZGxlSW5pdGlhbGl6ZS50cyc7XG5pbXBvcnQgaGFuZGxlR2V0U3RhdHVzIGZyb20gJy4vaGFuZGxlR2V0U3RhdHVzLnRzJztcbmltcG9ydCBoYW5kbGVTZXRTdGF0dXMgZnJvbSAnLi9oYW5kbGVTZXRTdGF0dXMudHMnO1xuaW1wb3J0IGhhbmRsZU9uRW5hYmxlIGZyb20gJy4vaGFuZGxlT25FbmFibGUudHMnO1xuaW1wb3J0IGhhbmRsZU9uSW5zdGFsbCBmcm9tICcuL2hhbmRsZU9uSW5zdGFsbC50cyc7XG5pbXBvcnQgaGFuZGxlT25EaXNhYmxlIGZyb20gJy4vaGFuZGxlT25EaXNhYmxlLnRzJztcbmltcG9ydCBoYW5kbGVPblVuaW5zdGFsbCBmcm9tICcuL2hhbmRsZU9uVW5pbnN0YWxsLnRzJztcbmltcG9ydCBoYW5kbGVPblByZVNldHRpbmdVcGRhdGUgZnJvbSAnLi9oYW5kbGVPblByZVNldHRpbmdVcGRhdGUudHMnO1xuaW1wb3J0IGhhbmRsZU9uU2V0dGluZ1VwZGF0ZWQgZnJvbSAnLi9oYW5kbGVPblNldHRpbmdVcGRhdGVkLnRzJztcbmltcG9ydCBoYW5kbGVMaXN0ZW5lciBmcm9tICcuLi9saXN0ZW5lci9oYW5kbGVyLnRzJztcbmltcG9ydCBoYW5kbGVVSUtpdEludGVyYWN0aW9uLCB7IHVpa2l0SW50ZXJhY3Rpb25zIH0gZnJvbSAnLi4vdWlraXQvaGFuZGxlci50cyc7XG5pbXBvcnQgeyBBcHBPYmplY3RSZWdpc3RyeSB9IGZyb20gJy4uLy4uL0FwcE9iamVjdFJlZ2lzdHJ5LnRzJztcbmltcG9ydCBoYW5kbGVPblVwZGF0ZSBmcm9tICcuL2hhbmRsZU9uVXBkYXRlLnRzJztcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlQXBwKG1ldGhvZDogc3RyaW5nLCBwYXJhbXM6IHVua25vd24pOiBQcm9taXNlPERlZmluZWQgfCBKc29uUnBjRXJyb3I+IHtcbiAgICBjb25zdCBbLCBhcHBNZXRob2RdID0gbWV0aG9kLnNwbGl0KCc6Jyk7XG5cbiAgICAvLyBXZSBkb24ndCB3YW50IHRoZSBnZXRTdGF0dXMgbWV0aG9kIHRvIGdlbmVyYXRlIGxvZ3MsIHNvIHdlIGhhbmRsZSBpdCBzZXBhcmF0ZWx5XG4gICAgaWYgKGFwcE1ldGhvZCA9PT0gJ2dldFN0YXR1cycpIHtcbiAgICAgICAgcmV0dXJuIGhhbmRsZUdldFN0YXR1cygpO1xuICAgIH1cblxuICAgIC8vIGBhcHBgIHdpbGwgYmUgdW5kZWZpbmVkIGlmIHRoZSBtZXRob2QgaGVyZSBpcyBcImFwcDpjb25zdHJ1Y3RcIlxuICAgIGNvbnN0IGFwcCA9IEFwcE9iamVjdFJlZ2lzdHJ5LmdldDxBcHA+KCdhcHAnKTtcblxuICAgIGFwcD8uZ2V0TG9nZ2VyKCkuZGVidWcoYCcke2FwcE1ldGhvZH0nIGlzIGJlaW5nIGNhbGxlZC4uLmApO1xuXG4gICAgaWYgKHVpa2l0SW50ZXJhY3Rpb25zLmluY2x1ZGVzKGFwcE1ldGhvZCkpIHtcbiAgICAgICAgcmV0dXJuIGhhbmRsZVVJS2l0SW50ZXJhY3Rpb24oYXBwTWV0aG9kLCBwYXJhbXMpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIEpzb25ScGNFcnJvcikge1xuICAgICAgICAgICAgICAgIGFwcD8uZ2V0TG9nZ2VyKCkuZGVidWcoYCcke2FwcE1ldGhvZH0nIHdhcyB1bnN1Y2Nlc3NmdWwuYCwgcmVzdWx0Lm1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcHA/LmdldExvZ2dlcigpLmRlYnVnKGAnJHthcHBNZXRob2R9JyB3YXMgc3VjY2Vzc2Z1bGx5IGNhbGxlZCEgVGhlIHJlc3VsdCBpczpgLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoYXBwTWV0aG9kLnN0YXJ0c1dpdGgoJ2NoZWNrJykgfHwgYXBwTWV0aG9kLnN0YXJ0c1dpdGgoJ2V4ZWN1dGUnKSkge1xuICAgICAgICByZXR1cm4gaGFuZGxlTGlzdGVuZXIoYXBwTWV0aG9kLCBwYXJhbXMpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIEpzb25ScGNFcnJvcikge1xuICAgICAgICAgICAgICAgIGFwcD8uZ2V0TG9nZ2VyKCkuZGVidWcoYCcke2FwcE1ldGhvZH0nIHdhcyB1bnN1Y2Nlc3NmdWwuYCwgcmVzdWx0Lm1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcHA/LmdldExvZ2dlcigpLmRlYnVnKGAnJHthcHBNZXRob2R9JyB3YXMgc3VjY2Vzc2Z1bGx5IGNhbGxlZCEgVGhlIHJlc3VsdCBpczpgLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0OiBEZWZpbmVkIHwgSnNvblJwY0Vycm9yO1xuXG4gICAgICAgIHN3aXRjaCAoYXBwTWV0aG9kKSB7XG4gICAgICAgICAgICBjYXNlICdjb25zdHJ1Y3QnOlxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZUNvbnN0cnVjdEFwcChwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaW5pdGlhbGl6ZSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlSW5pdGlhbGl6ZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc2V0U3RhdHVzJzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVTZXRTdGF0dXMocGFyYW1zKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29uRW5hYmxlJzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVPbkVuYWJsZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25EaXNhYmxlJzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVPbkRpc2FibGUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29uSW5zdGFsbCc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlT25JbnN0YWxsKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdvblVuaW5zdGFsbCc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlT25Vbmluc3RhbGwocGFyYW1zKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29uUHJlU2V0dGluZ1VwZGF0ZSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlT25QcmVTZXR0aW5nVXBkYXRlKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdvblNldHRpbmdVcGRhdGVkJzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVPblNldHRpbmdVcGRhdGVkKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdvblVwZGF0ZSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlT25VcGRhdGUocGFyYW1zKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEpzb25ScGNFcnJvcignTWV0aG9kIG5vdCBmb3VuZCcsIC0zMjYwMSk7XG4gICAgICAgIH1cblxuICAgICAgICBhcHA/LmdldExvZ2dlcigpLmRlYnVnKGAnJHthcHBNZXRob2R9JyB3YXMgc3VjY2Vzc2Z1bGx5IGNhbGxlZCEgVGhlIHJlc3VsdCBpczpgLCByZXN1bHQpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEpzb25ScGNFcnJvcignVW5rbm93biBlcnJvcicsIC0zMjAwMCwgZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKGUuY2F1c2UgYXMgc3RyaW5nKT8uaW5jbHVkZXMoJ2ludmFsaWRfcGFyYW1fdHlwZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gSnNvblJwY0Vycm9yLmludmFsaWRQYXJhbXMobnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKGUuY2F1c2UgYXMgc3RyaW5nKT8uaW5jbHVkZXMoJ2ludmFsaWRfYXBwJykpIHtcbiAgICAgICAgICAgIHJldHVybiBKc29uUnBjRXJyb3IuaW50ZXJuYWxFcnJvcih7IG1lc3NhZ2U6ICdBcHAgdW5hdmFpbGFibGUnIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBKc29uUnBjRXJyb3IoZS5tZXNzYWdl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