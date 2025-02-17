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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9kZW5vLXJ1bnRpbWUvaGFuZGxlcnMvYXBwL2hhbmRsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBcHAgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9BcHAudHMnO1xuaW1wb3J0IHsgRGVmaW5lZCwgSnNvblJwY0Vycm9yIH0gZnJvbSAnanNvbnJwYy1saXRlJztcblxuaW1wb3J0IGhhbmRsZUNvbnN0cnVjdEFwcCBmcm9tICcuL2NvbnN0cnVjdC50cyc7XG5pbXBvcnQgaGFuZGxlSW5pdGlhbGl6ZSBmcm9tICcuL2hhbmRsZUluaXRpYWxpemUudHMnO1xuaW1wb3J0IGhhbmRsZUdldFN0YXR1cyBmcm9tICcuL2hhbmRsZUdldFN0YXR1cy50cyc7XG5pbXBvcnQgaGFuZGxlU2V0U3RhdHVzIGZyb20gJy4vaGFuZGxlU2V0U3RhdHVzLnRzJztcbmltcG9ydCBoYW5kbGVPbkVuYWJsZSBmcm9tICcuL2hhbmRsZU9uRW5hYmxlLnRzJztcbmltcG9ydCBoYW5kbGVPbkluc3RhbGwgZnJvbSAnLi9oYW5kbGVPbkluc3RhbGwudHMnO1xuaW1wb3J0IGhhbmRsZU9uRGlzYWJsZSBmcm9tICcuL2hhbmRsZU9uRGlzYWJsZS50cyc7XG5pbXBvcnQgaGFuZGxlT25Vbmluc3RhbGwgZnJvbSAnLi9oYW5kbGVPblVuaW5zdGFsbC50cyc7XG5pbXBvcnQgaGFuZGxlT25QcmVTZXR0aW5nVXBkYXRlIGZyb20gJy4vaGFuZGxlT25QcmVTZXR0aW5nVXBkYXRlLnRzJztcbmltcG9ydCBoYW5kbGVPblNldHRpbmdVcGRhdGVkIGZyb20gJy4vaGFuZGxlT25TZXR0aW5nVXBkYXRlZC50cyc7XG5pbXBvcnQgaGFuZGxlTGlzdGVuZXIgZnJvbSAnLi4vbGlzdGVuZXIvaGFuZGxlci50cyc7XG5pbXBvcnQgaGFuZGxlVUlLaXRJbnRlcmFjdGlvbiwgeyB1aWtpdEludGVyYWN0aW9ucyB9IGZyb20gJy4uL3Vpa2l0L2hhbmRsZXIudHMnO1xuaW1wb3J0IHsgQXBwT2JqZWN0UmVnaXN0cnkgfSBmcm9tICcuLi8uLi9BcHBPYmplY3RSZWdpc3RyeS50cyc7XG5pbXBvcnQgaGFuZGxlT25VcGRhdGUgZnJvbSAnLi9oYW5kbGVPblVwZGF0ZS50cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUFwcChtZXRob2Q6IHN0cmluZywgcGFyYW1zOiB1bmtub3duKTogUHJvbWlzZTxEZWZpbmVkIHwgSnNvblJwY0Vycm9yPiB7XG4gICAgY29uc3QgWywgYXBwTWV0aG9kXSA9IG1ldGhvZC5zcGxpdCgnOicpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0aGUgZ2V0U3RhdHVzIG1ldGhvZCB0byBnZW5lcmF0ZSBsb2dzLCBzbyB3ZSBoYW5kbGUgaXQgc2VwYXJhdGVseVxuICAgICAgICBpZiAoYXBwTWV0aG9kID09PSAnZ2V0U3RhdHVzJykge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZUdldFN0YXR1cygpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYGFwcGAgd2lsbCBiZSB1bmRlZmluZWQgaWYgdGhlIG1ldGhvZCBoZXJlIGlzIFwiYXBwOmNvbnN0cnVjdFwiXG4gICAgICAgIGNvbnN0IGFwcCA9IEFwcE9iamVjdFJlZ2lzdHJ5LmdldDxBcHA+KCdhcHAnKTtcblxuICAgICAgICBhcHA/LmdldExvZ2dlcigpLmRlYnVnKGAnJHthcHBNZXRob2R9JyBpcyBiZWluZyBjYWxsZWQuLi5gKTtcblxuICAgICAgICBpZiAodWlraXRJbnRlcmFjdGlvbnMuaW5jbHVkZXMoYXBwTWV0aG9kKSkge1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZVVJS2l0SW50ZXJhY3Rpb24oYXBwTWV0aG9kLCBwYXJhbXMpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBKc29uUnBjRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBwPy5nZXRMb2dnZXIoKS5kZWJ1ZyhgJyR7YXBwTWV0aG9kfScgd2FzIHVuc3VjY2Vzc2Z1bC5gLCByZXN1bHQubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXBwPy5nZXRMb2dnZXIoKS5kZWJ1ZyhgJyR7YXBwTWV0aG9kfScgd2FzIHN1Y2Nlc3NmdWxseSBjYWxsZWQhIFRoZSByZXN1bHQgaXM6YCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXBwTWV0aG9kLnN0YXJ0c1dpdGgoJ2NoZWNrJykgfHwgYXBwTWV0aG9kLnN0YXJ0c1dpdGgoJ2V4ZWN1dGUnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZUxpc3RlbmVyKGFwcE1ldGhvZCwgcGFyYW1zKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgSnNvblJwY0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcD8uZ2V0TG9nZ2VyKCkuZGVidWcoYCcke2FwcE1ldGhvZH0nIHdhcyB1bnN1Y2Nlc3NmdWwuYCwgcmVzdWx0Lm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcD8uZ2V0TG9nZ2VyKCkuZGVidWcoYCcke2FwcE1ldGhvZH0nIHdhcyBzdWNjZXNzZnVsbHkgY2FsbGVkISBUaGUgcmVzdWx0IGlzOmAsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDogRGVmaW5lZCB8IEpzb25ScGNFcnJvcjtcblxuICAgICAgICBzd2l0Y2ggKGFwcE1ldGhvZCkge1xuICAgICAgICAgICAgY2FzZSAnY29uc3RydWN0JzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVDb25zdHJ1Y3RBcHAocGFyYW1zKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2luaXRpYWxpemUnOlxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZUluaXRpYWxpemUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3NldFN0YXR1cyc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlU2V0U3RhdHVzKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdvbkVuYWJsZSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlT25FbmFibGUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29uRGlzYWJsZSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlT25EaXNhYmxlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdvbkluc3RhbGwnOlxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZU9uSW5zdGFsbChwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25Vbmluc3RhbGwnOlxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZU9uVW5pbnN0YWxsKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdvblByZVNldHRpbmdVcGRhdGUnOlxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZU9uUHJlU2V0dGluZ1VwZGF0ZShwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25TZXR0aW5nVXBkYXRlZCc6XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlT25TZXR0aW5nVXBkYXRlZChwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25VcGRhdGUnOlxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZU9uVXBkYXRlKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBKc29uUnBjRXJyb3IoJ01ldGhvZCBub3QgZm91bmQnLCAtMzI2MDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXBwPy5nZXRMb2dnZXIoKS5kZWJ1ZyhgJyR7YXBwTWV0aG9kfScgd2FzIHN1Y2Nlc3NmdWxseSBjYWxsZWQhIFRoZSByZXN1bHQgaXM6YCwgcmVzdWx0KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBKc29uUnBjRXJyb3IoJ1Vua25vd24gZXJyb3InLCAtMzIwMDAsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKChlLmNhdXNlIGFzIHN0cmluZyk/LmluY2x1ZGVzKCdpbnZhbGlkX3BhcmFtX3R5cGUnKSkge1xuICAgICAgICAgICAgcmV0dXJuIEpzb25ScGNFcnJvci5pbnZhbGlkUGFyYW1zKG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKChlLmNhdXNlIGFzIHN0cmluZyk/LmluY2x1ZGVzKCdpbnZhbGlkX2FwcCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gSnNvblJwY0Vycm9yLmludGVybmFsRXJyb3IoeyBtZXNzYWdlOiAnQXBwIHVuYXZhaWxhYmxlJyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgSnNvblJwY0Vycm9yKGUubWVzc2FnZSwgLTMyMDAwLCBlKTtcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBa0IsWUFBWSxRQUFRLGVBQWU7QUFFckQsT0FBTyx3QkFBd0IsaUJBQWlCO0FBQ2hELE9BQU8sc0JBQXNCLHdCQUF3QjtBQUNyRCxPQUFPLHFCQUFxQix1QkFBdUI7QUFDbkQsT0FBTyxxQkFBcUIsdUJBQXVCO0FBQ25ELE9BQU8sb0JBQW9CLHNCQUFzQjtBQUNqRCxPQUFPLHFCQUFxQix1QkFBdUI7QUFDbkQsT0FBTyxxQkFBcUIsdUJBQXVCO0FBQ25ELE9BQU8sdUJBQXVCLHlCQUF5QjtBQUN2RCxPQUFPLDhCQUE4QixnQ0FBZ0M7QUFDckUsT0FBTyw0QkFBNEIsOEJBQThCO0FBQ2pFLE9BQU8sb0JBQW9CLHlCQUF5QjtBQUNwRCxPQUFPLDBCQUEwQixpQkFBaUIsUUFBUSxzQkFBc0I7QUFDaEYsU0FBUyxpQkFBaUIsUUFBUSw2QkFBNkI7QUFDL0QsT0FBTyxvQkFBb0Isc0JBQXNCO0FBRWpELGVBQWUsZUFBZSxVQUFVLE1BQWMsRUFBRSxNQUFlO0VBQ25FLE1BQU0sR0FBRyxVQUFVLEdBQUcsT0FBTyxLQUFLLENBQUM7RUFFbkMsSUFBSTtJQUNBLGtGQUFrRjtJQUNsRixJQUFJLGNBQWMsYUFBYTtNQUMzQixPQUFPLE1BQU07SUFDakI7SUFFQSxnRUFBZ0U7SUFDaEUsTUFBTSxNQUFNLGtCQUFrQixHQUFHLENBQU07SUFFdkMsS0FBSyxZQUFZLE1BQU0sQ0FBQyxDQUFDLEVBQUUsVUFBVSxvQkFBb0IsQ0FBQztJQUUxRCxJQUFJLGtCQUFrQixRQUFRLENBQUMsWUFBWTtNQUN2QyxPQUFPLHVCQUF1QixXQUFXLFFBQVEsSUFBSSxDQUFDLENBQUM7UUFDbkQsSUFBSSxrQkFBa0IsY0FBYztVQUNoQyxLQUFLLFlBQVksTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLG1CQUFtQixDQUFDLEVBQUUsT0FBTyxPQUFPO1FBQzdFLE9BQU87VUFDSCxLQUFLLFlBQVksTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLHlDQUF5QyxDQUFDLEVBQUU7UUFDckY7UUFFQSxPQUFPO01BQ1g7SUFDSjtJQUVBLElBQUksVUFBVSxVQUFVLENBQUMsWUFBWSxVQUFVLFVBQVUsQ0FBQyxZQUFZO01BQ2xFLE9BQU8sZUFBZSxXQUFXLFFBQVEsSUFBSSxDQUFDLENBQUM7UUFDM0MsSUFBSSxrQkFBa0IsY0FBYztVQUNoQyxLQUFLLFlBQVksTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLG1CQUFtQixDQUFDLEVBQUUsT0FBTyxPQUFPO1FBQzdFLE9BQU87VUFDSCxLQUFLLFlBQVksTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLHlDQUF5QyxDQUFDLEVBQUU7UUFDckY7UUFFQSxPQUFPO01BQ1g7SUFDSjtJQUVBLElBQUk7SUFFSixPQUFRO01BQ0osS0FBSztRQUNELFNBQVMsTUFBTSxtQkFBbUI7UUFDbEM7TUFDSixLQUFLO1FBQ0QsU0FBUyxNQUFNO1FBQ2Y7TUFDSixLQUFLO1FBQ0QsU0FBUyxNQUFNLGdCQUFnQjtRQUMvQjtNQUNKLEtBQUs7UUFDRCxTQUFTLE1BQU07UUFDZjtNQUNKLEtBQUs7UUFDRCxTQUFTLE1BQU07UUFDZjtNQUNKLEtBQUs7UUFDRCxTQUFTLE1BQU0sZ0JBQWdCO1FBQy9CO01BQ0osS0FBSztRQUNELFNBQVMsTUFBTSxrQkFBa0I7UUFDakM7TUFDSixLQUFLO1FBQ0QsU0FBUyxNQUFNLHlCQUF5QjtRQUN4QztNQUNKLEtBQUs7UUFDRCxTQUFTLE1BQU0sdUJBQXVCO1FBQ3RDO01BQ0osS0FBSztRQUNELFNBQVMsTUFBTSxlQUFlO1FBQzlCO01BQ0o7UUFDSSxNQUFNLElBQUksYUFBYSxvQkFBb0IsQ0FBQztJQUNwRDtJQUVBLEtBQUssWUFBWSxNQUFNLENBQUMsQ0FBQyxFQUFFLFVBQVUseUNBQXlDLENBQUMsRUFBRTtJQUVqRixPQUFPO0VBQ1gsRUFBRSxPQUFPLEdBQVk7SUFDakIsSUFBSSxDQUFDLENBQUMsYUFBYSxLQUFLLEdBQUc7TUFDdkIsT0FBTyxJQUFJLGFBQWEsaUJBQWlCLENBQUMsT0FBTztJQUNyRDtJQUVBLElBQUssRUFBRSxLQUFLLEVBQWEsU0FBUyx1QkFBdUI7TUFDckQsT0FBTyxhQUFhLGFBQWEsQ0FBQztJQUN0QztJQUVBLElBQUssRUFBRSxLQUFLLEVBQWEsU0FBUyxnQkFBZ0I7TUFDOUMsT0FBTyxhQUFhLGFBQWEsQ0FBQztRQUFFLFNBQVM7TUFBa0I7SUFDbkU7SUFFQSxPQUFPLElBQUksYUFBYSxFQUFFLE9BQU8sRUFBRSxDQUFDLE9BQU87RUFDL0M7QUFDSiJ9