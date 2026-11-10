function _ts_add_disposable_resource(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({
      value: value,
      dispose: dispose,
      async: async
    });
  } else if (async) {
    env.stack.push({
      async: true
    });
  }
  return value;
}
function _ts_dispose_resources(env) {
  var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };
  return (_ts_dispose_resources = function _ts_dispose_resources(env) {
    function fail(e) {
      env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while(r = env.stack.pop()){
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  })(env);
}
import { Buffer } from 'node:buffer';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions/AppsEngineException.ts';
import { toArrayBuffer } from '@std/streams';
import { JsonRpcError } from 'jsonrpc-lite';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { assertAppAvailable, assertHandlerFunction, isPlainObject } from '../lib/assertions.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest.ts';
export const uploadEvents = [
  'executePreFileUpload'
];
function assertIsUpload(v) {
  if (isPlainObject(v) && !!v.rid && (!!v.userId || !!v.visitorToken)) return;
  throw JsonRpcError.invalidParams({
    err: `Invalid 'file' parameter. Expected IUploadDetails, got`,
    value: v
  });
}
function assertString(v) {
  if (v && typeof v === 'string') return;
  throw JsonRpcError.invalidParams({
    err: `Invalid 'path' parameter. Expected string, got`,
    value: v
  });
}
export default async function handleUploadEvents(request) {
  const { method: rawMethod, params } = request;
  const [, method] = rawMethod.split(':');
  try {
    const env = {
      stack: [],
      error: void 0,
      hasError: false
    };
    try {
      const [{ file, path }] = params;
      const app = AppObjectRegistry.get('app');
      const handlerFunction = app?.[method];
      assertAppAvailable(app);
      assertHandlerFunction(handlerFunction);
      assertIsUpload(file);
      assertString(path);
      const tempFile = _ts_add_disposable_resource(env, await Deno.open(path, {
        read: true,
        create: false
      }), false);
      let context;
      switch(method){
        case 'executePreFileUpload':
          {
            const fileContents = await toArrayBuffer(tempFile.readable);
            context = {
              file,
              content: Buffer.from(fileContents)
            };
            break;
          }
      }
      return await handlerFunction.call(wrapAppForRequest(app, request), context, AppAccessorsInstance.getReader(), AppAccessorsInstance.getHttp(), AppAccessorsInstance.getPersistence(), AppAccessorsInstance.getModifier());
    } catch (e) {
      env.error = e;
      env.hasError = true;
    } finally{
      _ts_dispose_resources(env);
    }
  } catch (e) {
    if (e?.name === AppsEngineException.name) {
      return new JsonRpcError(e.message, AppsEngineException.JSONRPC_ERROR_CODE, {
        name: e.name
      });
    }
    if (e instanceof JsonRpcError) {
      return e;
    }
    return JsonRpcError.internalError({
      err: e.message,
      ...e.code && {
        code: e.code
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9oYW5kbGVycy9hcHAvaGFuZGxlVXBsb2FkRXZlbnRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ25vZGU6YnVmZmVyJztcblxuaW1wb3J0IHR5cGUgeyBBcHAgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9BcHAudHMnO1xuaW1wb3J0IHsgQXBwc0VuZ2luZUV4Y2VwdGlvbiB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2V4Y2VwdGlvbnMvQXBwc0VuZ2luZUV4Y2VwdGlvbi50cyc7XG5pbXBvcnQgdHlwZSB7IElGaWxlVXBsb2FkQ29udGV4dCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3VwbG9hZHMvSUZpbGVVcGxvYWRDb250ZXh0LnRzJ1xuaW1wb3J0IHR5cGUgeyBJVXBsb2FkRGV0YWlscyB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3VwbG9hZHMvSVVwbG9hZERldGFpbHMudHMnXG5pbXBvcnQgeyB0b0FycmF5QnVmZmVyIH0gZnJvbSAnQHN0ZC9zdHJlYW1zJztcbmltcG9ydCB7IERlZmluZWQsIEpzb25ScGNFcnJvciB9IGZyb20gJ2pzb25ycGMtbGl0ZSc7XG5cbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xuaW1wb3J0IHsgYXNzZXJ0QXBwQXZhaWxhYmxlLCBhc3NlcnRIYW5kbGVyRnVuY3Rpb24sIGlzUGxhaW5PYmplY3QgfSBmcm9tICcuLi9saWIvYXNzZXJ0aW9ucy50cyc7XG5pbXBvcnQgeyBBcHBBY2Nlc3NvcnNJbnN0YW5jZSB9IGZyb20gJy4uLy4uL2xpYi9hY2Nlc3NvcnMvbW9kLnRzJztcbmltcG9ydCB7IFJlcXVlc3RDb250ZXh0IH0gZnJvbSAnLi4vLi4vbGliL3JlcXVlc3RDb250ZXh0LnRzJztcbmltcG9ydCB7IHdyYXBBcHBGb3JSZXF1ZXN0IH0gZnJvbSAnLi4vLi4vbGliL3dyYXBBcHBGb3JSZXF1ZXN0LnRzJztcblxuZXhwb3J0IGNvbnN0IHVwbG9hZEV2ZW50cyA9IFsnZXhlY3V0ZVByZUZpbGVVcGxvYWQnXSBhcyBjb25zdDtcblxuZnVuY3Rpb24gYXNzZXJ0SXNVcGxvYWQodjogdW5rbm93bik6IGFzc2VydHMgdiBpcyBJVXBsb2FkRGV0YWlscyB7XG5cdGlmIChpc1BsYWluT2JqZWN0KHYpICYmICEhdi5yaWQgJiYgKCEhdi51c2VySWQgfHwgISF2LnZpc2l0b3JUb2tlbikpIHJldHVybjtcblxuXHR0aHJvdyBKc29uUnBjRXJyb3IuaW52YWxpZFBhcmFtcyh7IGVycjogYEludmFsaWQgJ2ZpbGUnIHBhcmFtZXRlci4gRXhwZWN0ZWQgSVVwbG9hZERldGFpbHMsIGdvdGAsIHZhbHVlOiB2IH0pO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRTdHJpbmcodjogdW5rbm93bik6IGFzc2VydHMgdiBpcyBzdHJpbmcge1xuXHRpZiAodiAmJiB0eXBlb2YgdiA9PT0gJ3N0cmluZycpIHJldHVybjtcblxuXHR0aHJvdyBKc29uUnBjRXJyb3IuaW52YWxpZFBhcmFtcyh7IGVycjogYEludmFsaWQgJ3BhdGgnIHBhcmFtZXRlci4gRXhwZWN0ZWQgc3RyaW5nLCBnb3RgLCB2YWx1ZTogdiB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlVXBsb2FkRXZlbnRzKHJlcXVlc3Q6IFJlcXVlc3RDb250ZXh0KTogUHJvbWlzZTxEZWZpbmVkIHwgSnNvblJwY0Vycm9yPiB7XG5cdGNvbnN0IHsgbWV0aG9kOiByYXdNZXRob2QsIHBhcmFtcyB9ID0gcmVxdWVzdCBhcyB7IG1ldGhvZDogYGFwcDoke3R5cGVvZiB1cGxvYWRFdmVudHNbbnVtYmVyXX1gOyBwYXJhbXM6IFt7IGZpbGU/OiBJVXBsb2FkRGV0YWlscywgcGF0aD86IHN0cmluZyB9XX07XG5cdGNvbnN0IFssIG1ldGhvZF0gPSByYXdNZXRob2Quc3BsaXQoJzonKSBhcyBbJ2FwcCcsIHR5cGVvZiB1cGxvYWRFdmVudHNbbnVtYmVyXV07XG5cblx0dHJ5IHtcblx0XHRjb25zdCBbeyBmaWxlLCBwYXRoIH1dID0gcGFyYW1zO1xuXG5cdFx0Y29uc3QgYXBwID0gQXBwT2JqZWN0UmVnaXN0cnkuZ2V0PEFwcD4oJ2FwcCcpO1xuXHRcdGNvbnN0IGhhbmRsZXJGdW5jdGlvbiA9IGFwcD8uW21ldGhvZCBhcyBrZXlvZiBBcHBdIGFzIHVua25vd247XG5cblx0XHRhc3NlcnRBcHBBdmFpbGFibGUoYXBwKTtcblx0XHRhc3NlcnRIYW5kbGVyRnVuY3Rpb24oaGFuZGxlckZ1bmN0aW9uKTtcblx0XHRhc3NlcnRJc1VwbG9hZChmaWxlKTtcblx0XHRhc3NlcnRTdHJpbmcocGF0aCk7XG5cblx0XHR1c2luZyB0ZW1wRmlsZSA9IGF3YWl0IERlbm8ub3BlbihwYXRoLCB7IHJlYWQ6IHRydWUsIGNyZWF0ZTogZmFsc2UgfSk7XG5cdFx0bGV0IGNvbnRleHQ6IElGaWxlVXBsb2FkQ29udGV4dDtcblxuXHRcdHN3aXRjaCAobWV0aG9kKSB7XG5cdFx0XHRjYXNlICdleGVjdXRlUHJlRmlsZVVwbG9hZCc6IHtcblx0XHRcdFx0Y29uc3QgZmlsZUNvbnRlbnRzID0gYXdhaXQgdG9BcnJheUJ1ZmZlcih0ZW1wRmlsZS5yZWFkYWJsZSk7XG5cdFx0XHRcdGNvbnRleHQgPSB7IGZpbGUsIGNvbnRlbnQ6IEJ1ZmZlci5mcm9tKGZpbGVDb250ZW50cykgfTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF3YWl0IGhhbmRsZXJGdW5jdGlvbi5jYWxsKFxuXHRcdFx0d3JhcEFwcEZvclJlcXVlc3QoYXBwLCByZXF1ZXN0KSxcblx0XHRcdGNvbnRleHQsXG5cdFx0XHRBcHBBY2Nlc3NvcnNJbnN0YW5jZS5nZXRSZWFkZXIoKSxcblx0XHRcdEFwcEFjY2Vzc29yc0luc3RhbmNlLmdldEh0dHAoKSxcblx0XHRcdEFwcEFjY2Vzc29yc0luc3RhbmNlLmdldFBlcnNpc3RlbmNlKCksXG5cdFx0XHRBcHBBY2Nlc3NvcnNJbnN0YW5jZS5nZXRNb2RpZmllcigpLFxuXHRcdCk7XG5cdH0gY2F0Y2goZSkge1xuXHRcdGlmIChlPy5uYW1lID09PSBBcHBzRW5naW5lRXhjZXB0aW9uLm5hbWUpIHtcblx0XHRcdHJldHVybiBuZXcgSnNvblJwY0Vycm9yKGUubWVzc2FnZSwgQXBwc0VuZ2luZUV4Y2VwdGlvbi5KU09OUlBDX0VSUk9SX0NPREUsIHsgbmFtZTogZS5uYW1lIH0pO1xuXHRcdH1cblxuXHRcdGlmIChlIGluc3RhbmNlb2YgSnNvblJwY0Vycm9yKSB7XG5cdFx0XHRyZXR1cm4gZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gSnNvblJwY0Vycm9yLmludGVybmFsRXJyb3Ioe1xuXHRcdFx0ZXJyOiBlLm1lc3NhZ2UsXG5cdFx0XHQuLi4oZS5jb2RlICYmIHsgY29kZTogZS5jb2RlIH0pLFxuXHRcdH0pO1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxTQUFTLE1BQU0sUUFBUSxjQUFjO0FBR3JDLFNBQVMsbUJBQW1CLFFBQVEsd0VBQXdFO0FBRzVHLFNBQVMsYUFBYSxRQUFRLGVBQWU7QUFDN0MsU0FBa0IsWUFBWSxRQUFRLGVBQWU7QUFFckQsU0FBUyxpQkFBaUIsUUFBUSw2QkFBNkI7QUFDL0QsU0FBUyxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBRSxhQUFhLFFBQVEsdUJBQXVCO0FBQ2hHLFNBQVMsb0JBQW9CLFFBQVEsNkJBQTZCO0FBRWxFLFNBQVMsaUJBQWlCLFFBQVEsaUNBQWlDO0FBRW5FLE9BQU8sTUFBTSxlQUFlO0VBQUM7Q0FBdUIsQ0FBVTtBQUU5RCxTQUFTLGVBQWUsQ0FBVTtFQUNqQyxJQUFJLGNBQWMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsWUFBWSxHQUFHO0VBRXJFLE1BQU0sYUFBYSxhQUFhLENBQUM7SUFBRSxLQUFLLENBQUMsc0RBQXNELENBQUM7SUFBRSxPQUFPO0VBQUU7QUFDNUc7QUFFQSxTQUFTLGFBQWEsQ0FBVTtFQUMvQixJQUFJLEtBQUssT0FBTyxNQUFNLFVBQVU7RUFFaEMsTUFBTSxhQUFhLGFBQWEsQ0FBQztJQUFFLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQztJQUFFLE9BQU87RUFBRTtBQUNwRztBQUVBLGVBQWUsZUFBZSxtQkFBbUIsT0FBdUI7RUFDdkUsTUFBTSxFQUFFLFFBQVEsU0FBUyxFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ3RDLE1BQU0sR0FBRyxPQUFPLEdBQUcsVUFBVSxLQUFLLENBQUM7RUFFbkMsSUFBSTs7Ozs7OztNQUNILE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHO01BRXpCLE1BQU0sTUFBTSxrQkFBa0IsR0FBRyxDQUFNO01BQ3ZDLE1BQU0sa0JBQWtCLEtBQUssQ0FBQyxPQUFvQjtNQUVsRCxtQkFBbUI7TUFDbkIsc0JBQXNCO01BQ3RCLGVBQWU7TUFDZixhQUFhO1lBRVAsNENBQVcsTUFBTSxLQUFLLElBQUksQ0FBQyxNQUFNO1FBQUUsTUFBTTtRQUFNLFFBQVE7TUFBTTtNQUNuRSxJQUFJO01BRUosT0FBUTtRQUNQLEtBQUs7VUFBd0I7WUFDNUIsTUFBTSxlQUFlLE1BQU0sY0FBYyxTQUFTLFFBQVE7WUFDMUQsVUFBVTtjQUFFO2NBQU0sU0FBUyxPQUFPLElBQUksQ0FBQztZQUFjO1lBQ3JEO1VBQ0Q7TUFDRDtNQUVBLE9BQU8sTUFBTSxnQkFBZ0IsSUFBSSxDQUNoQyxrQkFBa0IsS0FBSyxVQUN2QixTQUNBLHFCQUFxQixTQUFTLElBQzlCLHFCQUFxQixPQUFPLElBQzVCLHFCQUFxQixjQUFjLElBQ25DLHFCQUFxQixXQUFXOzs7Ozs7O0VBRWxDLEVBQUUsT0FBTSxHQUFHO0lBQ1YsSUFBSSxHQUFHLFNBQVMsb0JBQW9CLElBQUksRUFBRTtNQUN6QyxPQUFPLElBQUksYUFBYSxFQUFFLE9BQU8sRUFBRSxvQkFBb0Isa0JBQWtCLEVBQUU7UUFBRSxNQUFNLEVBQUUsSUFBSTtNQUFDO0lBQzNGO0lBRUEsSUFBSSxhQUFhLGNBQWM7TUFDOUIsT0FBTztJQUNSO0lBRUEsT0FBTyxhQUFhLGFBQWEsQ0FBQztNQUNqQyxLQUFLLEVBQUUsT0FBTztNQUNkLEdBQUksRUFBRSxJQUFJLElBQUk7UUFBRSxNQUFNLEVBQUUsSUFBSTtNQUFDLENBQUM7SUFDL0I7RUFDRDtBQUNEIn0=
// denoCacheMetadata=14802470494686712262,1729999536943510571