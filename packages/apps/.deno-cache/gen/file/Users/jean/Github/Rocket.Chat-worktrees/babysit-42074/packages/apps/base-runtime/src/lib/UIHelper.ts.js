import { randomUUID } from 'node:crypto';
/**
 * Duplicated from `packages/apps/src/server/misc/UIHelper.ts` so the base-runtime
 * does not have to import the host's compiled `apps/dist` output (a CJS `require`
 * that bypasses the Deno import map, and would create a host→base-runtime build
 * cycle if imported the other way). Both imports here are type-only (erased at
 * transpile) except `node:crypto`, which is available in every runtime.
 *
 * This is the single source of truth once the host accessors that still use the
 * `src/server/misc` copy are removed in the teardown phase of the accessor
 * consolidation; until then the two copies are kept byte-for-byte identical.
 */ export class UIHelper {
  /**
	 * Assign blockId, appId and actionId to every block/element inside the array
	 * @param blocks the blocks that will be iterated and assigned the ids
	 * @param appId the appId that will be assigned to
	 * @returns the array of block with the ids properties assigned
	 */ static assignIds(blocks, appId) {
    blocks.forEach((block)=>{
      if (!block.appId) {
        block.appId = appId;
      }
      if (!block.blockId) {
        block.blockId = randomUUID();
      }
      if (block.elements) {
        block.elements.forEach((element)=>{
          if (!element.actionId) {
            element.actionId = randomUUID();
          }
        });
      }
    });
    return blocks;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvamVhbi9HaXRodWIvUm9ja2V0LkNoYXQtd29ya3RyZWVzL2JhYnlzaXQtNDIwNzQvcGFja2FnZXMvYXBwcy9iYXNlLXJ1bnRpbWUvc3JjL2xpYi9VSUhlbHBlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByYW5kb21VVUlEIH0gZnJvbSAnbm9kZTpjcnlwdG8nO1xuXG5pbXBvcnQgdHlwZSB7IElCbG9jayB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3Vpa2l0JztcbmltcG9ydCB0eXBlIHsgTGF5b3V0QmxvY2sgfSBmcm9tICdAcm9ja2V0LmNoYXQvdWkta2l0JztcblxuLyoqXG4gKiBEdXBsaWNhdGVkIGZyb20gYHBhY2thZ2VzL2FwcHMvc3JjL3NlcnZlci9taXNjL1VJSGVscGVyLnRzYCBzbyB0aGUgYmFzZS1ydW50aW1lXG4gKiBkb2VzIG5vdCBoYXZlIHRvIGltcG9ydCB0aGUgaG9zdCdzIGNvbXBpbGVkIGBhcHBzL2Rpc3RgIG91dHB1dCAoYSBDSlMgYHJlcXVpcmVgXG4gKiB0aGF0IGJ5cGFzc2VzIHRoZSBEZW5vIGltcG9ydCBtYXAsIGFuZCB3b3VsZCBjcmVhdGUgYSBob3N04oaSYmFzZS1ydW50aW1lIGJ1aWxkXG4gKiBjeWNsZSBpZiBpbXBvcnRlZCB0aGUgb3RoZXIgd2F5KS4gQm90aCBpbXBvcnRzIGhlcmUgYXJlIHR5cGUtb25seSAoZXJhc2VkIGF0XG4gKiB0cmFuc3BpbGUpIGV4Y2VwdCBgbm9kZTpjcnlwdG9gLCB3aGljaCBpcyBhdmFpbGFibGUgaW4gZXZlcnkgcnVudGltZS5cbiAqXG4gKiBUaGlzIGlzIHRoZSBzaW5nbGUgc291cmNlIG9mIHRydXRoIG9uY2UgdGhlIGhvc3QgYWNjZXNzb3JzIHRoYXQgc3RpbGwgdXNlIHRoZVxuICogYHNyYy9zZXJ2ZXIvbWlzY2AgY29weSBhcmUgcmVtb3ZlZCBpbiB0aGUgdGVhcmRvd24gcGhhc2Ugb2YgdGhlIGFjY2Vzc29yXG4gKiBjb25zb2xpZGF0aW9uOyB1bnRpbCB0aGVuIHRoZSB0d28gY29waWVzIGFyZSBrZXB0IGJ5dGUtZm9yLWJ5dGUgaWRlbnRpY2FsLlxuICovXG5leHBvcnQgY2xhc3MgVUlIZWxwZXIge1xuXHQvKipcblx0ICogQXNzaWduIGJsb2NrSWQsIGFwcElkIGFuZCBhY3Rpb25JZCB0byBldmVyeSBibG9jay9lbGVtZW50IGluc2lkZSB0aGUgYXJyYXlcblx0ICogQHBhcmFtIGJsb2NrcyB0aGUgYmxvY2tzIHRoYXQgd2lsbCBiZSBpdGVyYXRlZCBhbmQgYXNzaWduZWQgdGhlIGlkc1xuXHQgKiBAcGFyYW0gYXBwSWQgdGhlIGFwcElkIHRoYXQgd2lsbCBiZSBhc3NpZ25lZCB0b1xuXHQgKiBAcmV0dXJucyB0aGUgYXJyYXkgb2YgYmxvY2sgd2l0aCB0aGUgaWRzIHByb3BlcnRpZXMgYXNzaWduZWRcblx0ICovXG5cdHB1YmxpYyBzdGF0aWMgYXNzaWduSWRzKGJsb2NrczogQXJyYXk8SUJsb2NrIHwgTGF5b3V0QmxvY2s+LCBhcHBJZDogc3RyaW5nKTogQXJyYXk8SUJsb2NrIHwgTGF5b3V0QmxvY2s+IHtcblx0XHRibG9ja3MuZm9yRWFjaCgoYmxvY2s6IChJQmxvY2sgfCBMYXlvdXRCbG9jaykgJiB7IGFwcElkPzogc3RyaW5nOyBibG9ja0lkPzogc3RyaW5nOyBlbGVtZW50cz86IEFycmF5PGFueT4gfSkgPT4ge1xuXHRcdFx0aWYgKCFibG9jay5hcHBJZCkge1xuXHRcdFx0XHRibG9jay5hcHBJZCA9IGFwcElkO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFibG9jay5ibG9ja0lkKSB7XG5cdFx0XHRcdGJsb2NrLmJsb2NrSWQgPSByYW5kb21VVUlEKCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYmxvY2suZWxlbWVudHMpIHtcblx0XHRcdFx0YmxvY2suZWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuXHRcdFx0XHRcdGlmICghZWxlbWVudC5hY3Rpb25JZCkge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5hY3Rpb25JZCA9IHJhbmRvbVVVSUQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGJsb2Nrcztcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsVUFBVSxRQUFRLGNBQWM7QUFLekM7Ozs7Ozs7Ozs7Q0FVQyxHQUNELE9BQU8sTUFBTTtFQUNaOzs7OztFQUtDLEdBQ0QsT0FBYyxVQUFVLE1BQW1DLEVBQUUsS0FBYSxFQUErQjtJQUN4RyxPQUFPLE9BQU8sQ0FBQyxDQUFDO01BQ2YsSUFBSSxDQUFDLE1BQU0sS0FBSyxFQUFFO1FBQ2pCLE1BQU0sS0FBSyxHQUFHO01BQ2Y7TUFDQSxJQUFJLENBQUMsTUFBTSxPQUFPLEVBQUU7UUFDbkIsTUFBTSxPQUFPLEdBQUc7TUFDakI7TUFDQSxJQUFJLE1BQU0sUUFBUSxFQUFFO1FBQ25CLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1VBQ3ZCLElBQUksQ0FBQyxRQUFRLFFBQVEsRUFBRTtZQUN0QixRQUFRLFFBQVEsR0FBRztVQUNwQjtRQUNEO01BQ0Q7SUFDRDtJQUVBLE9BQU87RUFDUjtBQUNEIn0=
// denoCacheMetadata=5796475352634890049,1560837255500025414