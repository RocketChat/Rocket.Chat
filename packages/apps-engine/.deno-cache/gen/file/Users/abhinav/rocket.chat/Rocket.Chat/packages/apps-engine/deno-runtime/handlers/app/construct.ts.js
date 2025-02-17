import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { require } from '../../lib/require.ts';
import { sanitizeDeprecatedUsage } from '../../lib/sanitizeDeprecatedUsage.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';
import { Socket } from 'node:net';
const ALLOWED_NATIVE_MODULES = [
  'path',
  'url',
  'crypto',
  'buffer',
  'stream',
  'net',
  'http',
  'https',
  'zlib',
  'util',
  'punycode',
  'os',
  'querystring',
  'fs'
];
const ALLOWED_EXTERNAL_MODULES = [
  'uuid'
];
function prepareEnvironment() {
  // Deno does not behave equally to Node when it comes to piping content to a socket
  // So we intervene here
  const originalFinal = Socket.prototype._final;
  Socket.prototype._final = function _final(cb) {
    // Deno closes the readable stream in the Socket earlier than Node
    // The exact reason for that is yet unknown, so we'll need to simply delay the execution
    // which allows data to be read in a response
    setTimeout(()=>originalFinal.call(this, cb), 1);
  };
}
// As the apps are bundled, the only times they will call require are
// 1. To require native modules
// 2. To require external npm packages we may provide
// 3. To require apps-engine files
function buildRequire() {
  return (module)=>{
    if (ALLOWED_NATIVE_MODULES.includes(module)) {
      return require(`node:${module}`);
    }
    if (ALLOWED_EXTERNAL_MODULES.includes(module)) {
      return require(`npm:${module}`);
    }
    if (module.startsWith('@rocket.chat/apps-engine')) {
      // Our `require` function knows how to handle these
      return require(module);
    }
    throw new Error(`Module ${module} is not allowed`);
  };
}
function wrapAppCode(code) {
  return new Function('require', `
        const { Buffer } = require('buffer');
        const exports = {};
        const module = { exports };
        const _error = console.error.bind(console);
        const _console = {
            log: _error,
            error: _error,
            debug: _error,
            info: _error,
            warn: _error,
        };

        const result = (async (exports,module,require,Buffer,console,globalThis,Deno) => {
            ${code};
        })(exports,module,require,Buffer,_console,undefined,undefined);

        return result.then(() => module.exports);`);
}
export default async function handleConstructApp(params) {
  if (!Array.isArray(params)) {
    throw new Error('Invalid params', {
      cause: 'invalid_param_type'
    });
  }
  const [appPackage] = params;
  if (!appPackage?.info?.id || !appPackage?.info?.classFile || !appPackage?.files) {
    throw new Error('Invalid params', {
      cause: 'invalid_param_type'
    });
  }
  prepareEnvironment();
  AppObjectRegistry.set('id', appPackage.info.id);
  const source = sanitizeDeprecatedUsage(appPackage.files[appPackage.info.classFile]);
  const require = buildRequire();
  const exports = await wrapAppCode(source)(require);
  // This is the same naive logic we've been using in the App Compiler
  // Applying the correct type here is quite difficult because of the dynamic nature of the code
  // deno-lint-ignore no-explicit-any
  const appClass = Object.values(exports)[0];
  const logger = AppObjectRegistry.get('logger');
  const app = new appClass(appPackage.info, logger, AppAccessorsInstance.getDefaultAppAccessors());
  if (typeof app.getName !== 'function') {
    throw new Error('App must contain a getName function');
  }
  if (typeof app.getNameSlug !== 'function') {
    throw new Error('App must contain a getNameSlug function');
  }
  if (typeof app.getVersion !== 'function') {
    throw new Error('App must contain a getVersion function');
  }
  if (typeof app.getID !== 'function') {
    throw new Error('App must contain a getID function');
  }
  if (typeof app.getDescription !== 'function') {
    throw new Error('App must contain a getDescription function');
  }
  if (typeof app.getRequiredApiVersion !== 'function') {
    throw new Error('App must contain a getRequiredApiVersion function');
  }
  AppObjectRegistry.set('app', app);
  return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9kZW5vLXJ1bnRpbWUvaGFuZGxlcnMvYXBwL2NvbnN0cnVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElQYXJzZUFwcFBhY2thZ2VSZXN1bHQgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL2NvbXBpbGVyL0lQYXJzZUFwcFBhY2thZ2VSZXN1bHQudHMnO1xuXG5pbXBvcnQgeyBBcHBPYmplY3RSZWdpc3RyeSB9IGZyb20gJy4uLy4uL0FwcE9iamVjdFJlZ2lzdHJ5LnRzJztcbmltcG9ydCB7IHJlcXVpcmUgfSBmcm9tICcuLi8uLi9saWIvcmVxdWlyZS50cyc7XG5pbXBvcnQgeyBzYW5pdGl6ZURlcHJlY2F0ZWRVc2FnZSB9IGZyb20gJy4uLy4uL2xpYi9zYW5pdGl6ZURlcHJlY2F0ZWRVc2FnZS50cyc7XG5pbXBvcnQgeyBBcHBBY2Nlc3NvcnNJbnN0YW5jZSB9IGZyb20gJy4uLy4uL2xpYi9hY2Nlc3NvcnMvbW9kLnRzJztcbmltcG9ydCB7IFNvY2tldCB9IGZyb20gJ25vZGU6bmV0JztcblxuY29uc3QgQUxMT1dFRF9OQVRJVkVfTU9EVUxFUyA9IFsncGF0aCcsICd1cmwnLCAnY3J5cHRvJywgJ2J1ZmZlcicsICdzdHJlYW0nLCAnbmV0JywgJ2h0dHAnLCAnaHR0cHMnLCAnemxpYicsICd1dGlsJywgJ3B1bnljb2RlJywgJ29zJywgJ3F1ZXJ5c3RyaW5nJywgJ2ZzJ107XG5jb25zdCBBTExPV0VEX0VYVEVSTkFMX01PRFVMRVMgPSBbJ3V1aWQnXTtcblxuXG5mdW5jdGlvbiBwcmVwYXJlRW52aXJvbm1lbnQoKSB7XG4gICAgLy8gRGVubyBkb2VzIG5vdCBiZWhhdmUgZXF1YWxseSB0byBOb2RlIHdoZW4gaXQgY29tZXMgdG8gcGlwaW5nIGNvbnRlbnQgdG8gYSBzb2NrZXRcbiAgICAvLyBTbyB3ZSBpbnRlcnZlbmUgaGVyZVxuICAgIGNvbnN0IG9yaWdpbmFsRmluYWwgPSBTb2NrZXQucHJvdG90eXBlLl9maW5hbDtcbiAgICBTb2NrZXQucHJvdG90eXBlLl9maW5hbCA9IGZ1bmN0aW9uIF9maW5hbChjYikge1xuICAgICAgICAvLyBEZW5vIGNsb3NlcyB0aGUgcmVhZGFibGUgc3RyZWFtIGluIHRoZSBTb2NrZXQgZWFybGllciB0aGFuIE5vZGVcbiAgICAgICAgLy8gVGhlIGV4YWN0IHJlYXNvbiBmb3IgdGhhdCBpcyB5ZXQgdW5rbm93biwgc28gd2UnbGwgbmVlZCB0byBzaW1wbHkgZGVsYXkgdGhlIGV4ZWN1dGlvblxuICAgICAgICAvLyB3aGljaCBhbGxvd3MgZGF0YSB0byBiZSByZWFkIGluIGEgcmVzcG9uc2VcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiBvcmlnaW5hbEZpbmFsLmNhbGwodGhpcywgY2IpLCAxKTtcbiAgICB9O1xufVxuXG4vLyBBcyB0aGUgYXBwcyBhcmUgYnVuZGxlZCwgdGhlIG9ubHkgdGltZXMgdGhleSB3aWxsIGNhbGwgcmVxdWlyZSBhcmVcbi8vIDEuIFRvIHJlcXVpcmUgbmF0aXZlIG1vZHVsZXNcbi8vIDIuIFRvIHJlcXVpcmUgZXh0ZXJuYWwgbnBtIHBhY2thZ2VzIHdlIG1heSBwcm92aWRlXG4vLyAzLiBUbyByZXF1aXJlIGFwcHMtZW5naW5lIGZpbGVzXG5mdW5jdGlvbiBidWlsZFJlcXVpcmUoKTogKG1vZHVsZTogc3RyaW5nKSA9PiB1bmtub3duIHtcbiAgICByZXR1cm4gKG1vZHVsZTogc3RyaW5nKTogdW5rbm93biA9PiB7XG4gICAgICAgIGlmIChBTExPV0VEX05BVElWRV9NT0RVTEVTLmluY2x1ZGVzKG1vZHVsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXF1aXJlKGBub2RlOiR7bW9kdWxlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFMTE9XRURfRVhURVJOQUxfTU9EVUxFUy5pbmNsdWRlcyhtb2R1bGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWlyZShgbnBtOiR7bW9kdWxlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1vZHVsZS5zdGFydHNXaXRoKCdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUnKSkge1xuICAgICAgICAgICAgLy8gT3VyIGByZXF1aXJlYCBmdW5jdGlvbiBrbm93cyBob3cgdG8gaGFuZGxlIHRoZXNlXG4gICAgICAgICAgICByZXR1cm4gcmVxdWlyZShtb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNb2R1bGUgJHttb2R1bGV9IGlzIG5vdCBhbGxvd2VkYCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gd3JhcEFwcENvZGUoY29kZTogc3RyaW5nKTogKHJlcXVpcmU6IChtb2R1bGU6IHN0cmluZykgPT4gdW5rbm93bikgPT4gUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXG4gICAgICAgICdyZXF1aXJlJyxcbiAgICAgICAgYFxuICAgICAgICBjb25zdCB7IEJ1ZmZlciB9ID0gcmVxdWlyZSgnYnVmZmVyJyk7XG4gICAgICAgIGNvbnN0IGV4cG9ydHMgPSB7fTtcbiAgICAgICAgY29uc3QgbW9kdWxlID0geyBleHBvcnRzIH07XG4gICAgICAgIGNvbnN0IF9lcnJvciA9IGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlKTtcbiAgICAgICAgY29uc3QgX2NvbnNvbGUgPSB7XG4gICAgICAgICAgICBsb2c6IF9lcnJvcixcbiAgICAgICAgICAgIGVycm9yOiBfZXJyb3IsXG4gICAgICAgICAgICBkZWJ1ZzogX2Vycm9yLFxuICAgICAgICAgICAgaW5mbzogX2Vycm9yLFxuICAgICAgICAgICAgd2FybjogX2Vycm9yLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IChhc3luYyAoZXhwb3J0cyxtb2R1bGUscmVxdWlyZSxCdWZmZXIsY29uc29sZSxnbG9iYWxUaGlzLERlbm8pID0+IHtcbiAgICAgICAgICAgICR7Y29kZX07XG4gICAgICAgIH0pKGV4cG9ydHMsbW9kdWxlLHJlcXVpcmUsQnVmZmVyLF9jb25zb2xlLHVuZGVmaW5lZCx1bmRlZmluZWQpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQudGhlbigoKSA9PiBtb2R1bGUuZXhwb3J0cyk7YCxcbiAgICApIGFzIChyZXF1aXJlOiAobW9kdWxlOiBzdHJpbmcpID0+IHVua25vd24pID0+IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVDb25zdHJ1Y3RBcHAocGFyYW1zOiB1bmtub3duKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHBhcmFtcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhcmFtcycsIHsgY2F1c2U6ICdpbnZhbGlkX3BhcmFtX3R5cGUnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IFthcHBQYWNrYWdlXSA9IHBhcmFtcyBhcyBbSVBhcnNlQXBwUGFja2FnZVJlc3VsdF07XG5cbiAgICBpZiAoIWFwcFBhY2thZ2U/LmluZm8/LmlkIHx8ICFhcHBQYWNrYWdlPy5pbmZvPy5jbGFzc0ZpbGUgfHwgIWFwcFBhY2thZ2U/LmZpbGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXJhbXMnLCB7IGNhdXNlOiAnaW52YWxpZF9wYXJhbV90eXBlJyB9KTtcbiAgICB9XG5cbiAgICBwcmVwYXJlRW52aXJvbm1lbnQoKTtcblxuICAgIEFwcE9iamVjdFJlZ2lzdHJ5LnNldCgnaWQnLCBhcHBQYWNrYWdlLmluZm8uaWQpO1xuICAgIGNvbnN0IHNvdXJjZSA9IHNhbml0aXplRGVwcmVjYXRlZFVzYWdlKGFwcFBhY2thZ2UuZmlsZXNbYXBwUGFja2FnZS5pbmZvLmNsYXNzRmlsZV0pO1xuXG4gICAgY29uc3QgcmVxdWlyZSA9IGJ1aWxkUmVxdWlyZSgpO1xuICAgIGNvbnN0IGV4cG9ydHMgPSBhd2FpdCB3cmFwQXBwQ29kZShzb3VyY2UpKHJlcXVpcmUpO1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgc2FtZSBuYWl2ZSBsb2dpYyB3ZSd2ZSBiZWVuIHVzaW5nIGluIHRoZSBBcHAgQ29tcGlsZXJcbiAgICAvLyBBcHBseWluZyB0aGUgY29ycmVjdCB0eXBlIGhlcmUgaXMgcXVpdGUgZGlmZmljdWx0IGJlY2F1c2Ugb2YgdGhlIGR5bmFtaWMgbmF0dXJlIG9mIHRoZSBjb2RlXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBhcHBDbGFzcyA9IE9iamVjdC52YWx1ZXMoZXhwb3J0cylbMF0gYXMgYW55O1xuICAgIGNvbnN0IGxvZ2dlciA9IEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnbG9nZ2VyJyk7XG5cbiAgICBjb25zdCBhcHAgPSBuZXcgYXBwQ2xhc3MoYXBwUGFja2FnZS5pbmZvLCBsb2dnZXIsIEFwcEFjY2Vzc29yc0luc3RhbmNlLmdldERlZmF1bHRBcHBBY2Nlc3NvcnMoKSk7XG5cbiAgICBpZiAodHlwZW9mIGFwcC5nZXROYW1lICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldE5hbWUgZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFwcC5nZXROYW1lU2x1ZyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FwcCBtdXN0IGNvbnRhaW4gYSBnZXROYW1lU2x1ZyBmdW5jdGlvbicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXBwLmdldFZlcnNpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0VmVyc2lvbiBmdW5jdGlvbicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXBwLmdldElEICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXBwIG11c3QgY29udGFpbiBhIGdldElEIGZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBhcHAuZ2V0RGVzY3JpcHRpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0RGVzY3JpcHRpb24gZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFwcC5nZXRSZXF1aXJlZEFwaVZlcnNpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcHAgbXVzdCBjb250YWluIGEgZ2V0UmVxdWlyZWRBcGlWZXJzaW9uIGZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgQXBwT2JqZWN0UmVnaXN0cnkuc2V0KCdhcHAnLCBhcHApO1xuXG4gICAgcmV0dXJuIHRydWU7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsU0FBUyxpQkFBaUIsUUFBUSw2QkFBNkI7QUFDL0QsU0FBUyxPQUFPLFFBQVEsdUJBQXVCO0FBQy9DLFNBQVMsdUJBQXVCLFFBQVEsdUNBQXVDO0FBQy9FLFNBQVMsb0JBQW9CLFFBQVEsNkJBQTZCO0FBQ2xFLFNBQVMsTUFBTSxRQUFRLFdBQVc7QUFFbEMsTUFBTSx5QkFBeUI7RUFBQztFQUFRO0VBQU87RUFBVTtFQUFVO0VBQVU7RUFBTztFQUFRO0VBQVM7RUFBUTtFQUFRO0VBQVk7RUFBTTtFQUFlO0NBQUs7QUFDM0osTUFBTSwyQkFBMkI7RUFBQztDQUFPO0FBR3pDLFNBQVM7RUFDTCxtRkFBbUY7RUFDbkYsdUJBQXVCO0VBQ3ZCLE1BQU0sZ0JBQWdCLE9BQU8sU0FBUyxDQUFDLE1BQU07RUFDN0MsT0FBTyxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsT0FBTyxFQUFFO0lBQ3hDLGtFQUFrRTtJQUNsRSx3RkFBd0Y7SUFDeEYsNkNBQTZDO0lBQzdDLFdB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