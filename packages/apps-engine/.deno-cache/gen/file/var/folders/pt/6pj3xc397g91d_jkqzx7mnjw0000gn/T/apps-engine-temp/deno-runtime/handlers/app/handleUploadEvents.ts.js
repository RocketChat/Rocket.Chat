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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdmFyL2ZvbGRlcnMvcHQvNnBqM3hjMzk3ZzkxZF9qa3F6eDdtbmp3MDAwMGduL1QvYXBwcy1lbmdpbmUtdGVtcC9kZW5vLXJ1bnRpbWUvaGFuZGxlcnMvYXBwL2hhbmRsZVVwbG9hZEV2ZW50cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdub2RlOmJ1ZmZlcic7XG5cbmltcG9ydCB0eXBlIHsgQXBwIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vQXBwLnRzJztcbmltcG9ydCB7IEFwcHNFbmdpbmVFeGNlcHRpb24gfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9leGNlcHRpb25zL0FwcHNFbmdpbmVFeGNlcHRpb24udHMnO1xuaW1wb3J0IHR5cGUgeyBJRmlsZVVwbG9hZENvbnRleHQgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi91cGxvYWRzL0lGaWxlVXBsb2FkQ29udGV4dC50cydcbmltcG9ydCB0eXBlIHsgSVVwbG9hZERldGFpbHMgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi91cGxvYWRzL0lVcGxvYWREZXRhaWxzLnRzJ1xuaW1wb3J0IHsgdG9BcnJheUJ1ZmZlciB9IGZyb20gJ0BzdGQvc3RyZWFtcyc7XG5pbXBvcnQgeyBEZWZpbmVkLCBKc29uUnBjRXJyb3IgfSBmcm9tICdqc29ucnBjLWxpdGUnO1xuXG5pbXBvcnQgeyBBcHBPYmplY3RSZWdpc3RyeSB9IGZyb20gJy4uLy4uL0FwcE9iamVjdFJlZ2lzdHJ5LnRzJztcbmltcG9ydCB7IGFzc2VydEFwcEF2YWlsYWJsZSwgYXNzZXJ0SGFuZGxlckZ1bmN0aW9uLCBpc1BsYWluT2JqZWN0IH0gZnJvbSAnLi4vbGliL2Fzc2VydGlvbnMudHMnO1xuaW1wb3J0IHsgQXBwQWNjZXNzb3JzSW5zdGFuY2UgfSBmcm9tICcuLi8uLi9saWIvYWNjZXNzb3JzL21vZC50cyc7XG5pbXBvcnQgeyBSZXF1ZXN0Q29udGV4dCB9IGZyb20gJy4uLy4uL2xpYi9yZXF1ZXN0Q29udGV4dC50cyc7XG5pbXBvcnQgeyB3cmFwQXBwRm9yUmVxdWVzdCB9IGZyb20gJy4uLy4uL2xpYi93cmFwQXBwRm9yUmVxdWVzdC50cyc7XG5cbmV4cG9ydCBjb25zdCB1cGxvYWRFdmVudHMgPSBbJ2V4ZWN1dGVQcmVGaWxlVXBsb2FkJ10gYXMgY29uc3Q7XG5cbmZ1bmN0aW9uIGFzc2VydElzVXBsb2FkKHY6IHVua25vd24pOiBhc3NlcnRzIHYgaXMgSVVwbG9hZERldGFpbHMge1xuXHRpZiAoaXNQbGFpbk9iamVjdCh2KSAmJiAhIXYucmlkICYmICghIXYudXNlcklkIHx8ICEhdi52aXNpdG9yVG9rZW4pKSByZXR1cm47XG5cblx0dGhyb3cgSnNvblJwY0Vycm9yLmludmFsaWRQYXJhbXMoeyBlcnI6IGBJbnZhbGlkICdmaWxlJyBwYXJhbWV0ZXIuIEV4cGVjdGVkIElVcGxvYWREZXRhaWxzLCBnb3RgLCB2YWx1ZTogdiB9KTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0U3RyaW5nKHY6IHVua25vd24pOiBhc3NlcnRzIHYgaXMgc3RyaW5nIHtcblx0aWYgKHYgJiYgdHlwZW9mIHYgPT09ICdzdHJpbmcnKSByZXR1cm47XG5cblx0dGhyb3cgSnNvblJwY0Vycm9yLmludmFsaWRQYXJhbXMoeyBlcnI6IGBJbnZhbGlkICdwYXRoJyBwYXJhbWV0ZXIuIEV4cGVjdGVkIHN0cmluZywgZ290YCwgdmFsdWU6IHYgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVVwbG9hZEV2ZW50cyhyZXF1ZXN0OiBSZXF1ZXN0Q29udGV4dCk6IFByb21pc2U8RGVmaW5lZCB8IEpzb25ScGNFcnJvcj4ge1xuXHRjb25zdCB7IG1ldGhvZDogcmF3TWV0aG9kLCBwYXJhbXMgfSA9IHJlcXVlc3QgYXMgeyBtZXRob2Q6IGBhcHA6JHt0eXBlb2YgdXBsb2FkRXZlbnRzW251bWJlcl19YDsgcGFyYW1zOiBbeyBmaWxlPzogSVVwbG9hZERldGFpbHMsIHBhdGg/OiBzdHJpbmcgfV19O1xuXHRjb25zdCBbLCBtZXRob2RdID0gcmF3TWV0aG9kLnNwbGl0KCc6JykgYXMgWydhcHAnLCB0eXBlb2YgdXBsb2FkRXZlbnRzW251bWJlcl1dO1xuXG5cdHRyeSB7XG5cdFx0Y29uc3QgW3sgZmlsZSwgcGF0aCB9XSA9IHBhcmFtcztcblxuXHRcdGNvbnN0IGFwcCA9IEFwcE9iamVjdFJlZ2lzdHJ5LmdldDxBcHA+KCdhcHAnKTtcblx0XHRjb25zdCBoYW5kbGVyRnVuY3Rpb24gPSBhcHA/LlttZXRob2QgYXMga2V5b2YgQXBwXSBhcyB1bmtub3duO1xuXG5cdFx0YXNzZXJ0QXBwQXZhaWxhYmxlKGFwcCk7XG5cdFx0YXNzZXJ0SGFuZGxlckZ1bmN0aW9uKGhhbmRsZXJGdW5jdGlvbik7XG5cdFx0YXNzZXJ0SXNVcGxvYWQoZmlsZSk7XG5cdFx0YXNzZXJ0U3RyaW5nKHBhdGgpO1xuXG5cdFx0dXNpbmcgdGVtcEZpbGUgPSBhd2FpdCBEZW5vLm9wZW4ocGF0aCwgeyByZWFkOiB0cnVlLCBjcmVhdGU6IGZhbHNlIH0pO1xuXHRcdGxldCBjb250ZXh0OiBJRmlsZVVwbG9hZENvbnRleHQ7XG5cblx0XHRzd2l0Y2ggKG1ldGhvZCkge1xuXHRcdFx0Y2FzZSAnZXhlY3V0ZVByZUZpbGVVcGxvYWQnOiB7XG5cdFx0XHRcdGNvbnN0IGZpbGVDb250ZW50cyA9IGF3YWl0IHRvQXJyYXlCdWZmZXIodGVtcEZpbGUucmVhZGFibGUpO1xuXHRcdFx0XHRjb250ZXh0ID0geyBmaWxlLCBjb250ZW50OiBCdWZmZXIuZnJvbShmaWxlQ29udGVudHMpIH07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBhd2FpdCBoYW5kbGVyRnVuY3Rpb24uY2FsbChcblx0XHRcdHdyYXBBcHBGb3JSZXF1ZXN0KGFwcCwgcmVxdWVzdCksXG5cdFx0XHRjb250ZXh0LFxuXHRcdFx0QXBwQWNjZXNzb3JzSW5zdGFuY2UuZ2V0UmVhZGVyKCksXG5cdFx0XHRBcHBBY2Nlc3NvcnNJbnN0YW5jZS5nZXRIdHRwKCksXG5cdFx0XHRBcHBBY2Nlc3NvcnNJbnN0YW5jZS5nZXRQZXJzaXN0ZW5jZSgpLFxuXHRcdFx0QXBwQWNjZXNzb3JzSW5zdGFuY2UuZ2V0TW9kaWZpZXIoKSxcblx0XHQpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHRpZiAoZT8ubmFtZSA9PT0gQXBwc0VuZ2luZUV4Y2VwdGlvbi5uYW1lKSB7XG5cdFx0XHRyZXR1cm4gbmV3IEpzb25ScGNFcnJvcihlLm1lc3NhZ2UsIEFwcHNFbmdpbmVFeGNlcHRpb24uSlNPTlJQQ19FUlJPUl9DT0RFLCB7IG5hbWU6IGUubmFtZSB9KTtcblx0XHR9XG5cblx0XHRpZiAoZSBpbnN0YW5jZW9mIEpzb25ScGNFcnJvcikge1xuXHRcdFx0cmV0dXJuIGU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEpzb25ScGNFcnJvci5pbnRlcm5hbEVycm9yKHtcblx0XHRcdGVycjogZS5tZXNzYWdlLFxuXHRcdFx0Li4uKGUuY29kZSAmJiB7IGNvZGU6IGUuY29kZSB9KSxcblx0XHR9KTtcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsU0FBUyxNQUFNLFFBQVEsY0FBYztBQUdyQyxTQUFTLG1CQUFtQixRQUFRLHdFQUF3RTtBQUc1RyxTQUFTLGFBQWEsUUFBUSxlQUFlO0FBQzdDLFNBQWtCLFlBQVksUUFBUSxlQUFlO0FBRXJELFNBQVMsaUJBQWlCLFFBQVEsNkJBQTZCO0FBQy9ELFNBQVMsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxRQUFRLHVCQUF1QjtBQUNoRyxTQUFTLG9CQUFvQixRQUFRLDZCQUE2QjtBQUVsRSxTQUFTLGlCQUFpQixRQUFRLGlDQUFpQztBQUVuRSxPQUFPLE1BQU0sZUFBZTtFQUFDO0NBQXVCLENBQVU7QUFFOUQsU0FBUyxlQUFlLENBQVU7RUFDakMsSUFBSSxjQUFjLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLFlBQVksR0FBRztFQUVyRSxNQUFNLGFBQWEsYUFBYSxDQUFDO0lBQUUsS0FBSyxDQUFDLHNEQUFzRCxDQUFDO0lBQUUsT0FBTztFQUFFO0FBQzVHO0FBRUEsU0FBUyxhQUFhLENBQVU7RUFDL0IsSUFBSSxLQUFLLE9BQU8sTUFBTSxVQUFVO0VBRWhDLE1BQU0sYUFBYSxhQUFhLENBQUM7SUFBRSxLQUFLLENBQUMsOENBQThDLENBQUM7SUFBRSxPQUFPO0VBQUU7QUFDcEc7QUFFQSxlQUFlLGVBQWUsbUJBQW1CLE9BQXVCO0VBQ3ZFLE1BQU0sRUFBRSxRQUFRLFNBQVMsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUN0QyxNQUFNLEdBQUcsT0FBTyxHQUFHLFVBQVUsS0FBSyxDQUFDO0VBRW5DLElBQUk7Ozs7Ozs7TUFDSCxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRztNQUV6QixNQUFNLE1BQU0sa0JBQWtCLEdBQUcsQ0FBTTtNQUN2QyxNQUFNLGtCQUFrQixLQUFLLENBQUMsT0FBb0I7TUFFbEQsbUJBQW1CO01BQ25CLHNCQUFzQjtNQUN0QixlQUFlO01BQ2YsYUFBYTtZQUVQLDRDQUFXLE1BQU0sS0FBSyxJQUFJLENBQUMsTUFBTTtRQUFFLE1BQU07UUFBTSxRQUFRO01BQU07TUFDbkUsSUFBSTtNQUVKLE9BQVE7UUFDUCxLQUFLO1VBQXdCO1lBQzVCLE1BQU0sZUFBZSxNQUFNLGNBQWMsU0FBUyxRQUFRO1lBQzFELFVBQVU7Y0FBRTtjQUFNLFNBQVMsT0FBTyxJQUFJLENBQUM7WUFBYztZQUNyRDtVQUNEO01BQ0Q7TUFFQSxPQUFPLE1BQU0sZ0JBQWdCLElBQUksQ0FDaEMsa0JBQWtCLEtBQUssVUFDdkIsU0FDQSxxQkFBcUIsU0FBUyxJQUM5QixxQkFBcUIsT0FBTyxJQUM1QixxQkFBcUIsY0FBYyxJQUNuQyxxQkFBcUIsV0FBVzs7Ozs7OztFQUVsQyxFQUFFLE9BQU0sR0FBRztJQUNWLElBQUksR0FBRyxTQUFTLG9CQUFvQixJQUFJLEVBQUU7TUFDekMsT0FBTyxJQUFJLGFBQWEsRUFBRSxPQUFPLEVBQUUsb0JBQW9CLGtCQUFrQixFQUFFO1FBQUUsTUFBTSxFQUFFLElBQUk7TUFBQztJQUMzRjtJQUVBLElBQUksYUFBYSxjQUFjO01BQzlCLE9BQU87SUFDUjtJQUVBLE9BQU8sYUFBYSxhQUFhLENBQUM7TUFDakMsS0FBSyxFQUFFLE9BQU87TUFDZCxHQUFJLEVBQUUsSUFBSSxJQUFJO1FBQUUsTUFBTSxFQUFFLElBQUk7TUFBQyxDQUFDO0lBQy9CO0VBQ0Q7QUFDRCJ9
// denoCacheMetadata=14802470494686712262,305740347049298425