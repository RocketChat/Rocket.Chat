import { v4 as uuid } from 'uuid';
export class UIHelper {
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
        block.blockId = uuid();
      }
      if (block.elements) {
        block.elements.forEach((element)=>{
          if (!element.actionId) {
            element.actionId = uuid();
          }
        });
      }
    });
    return blocks;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9idWlsZGVyL21lZHNlbnNlLndlYmNoYXQvcGFja2FnZXMvYXBwcy1lbmdpbmUvc3JjL3NlcnZlci9taXNjL1VJSGVscGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTGF5b3V0QmxvY2sgfSBmcm9tICdAcm9ja2V0LmNoYXQvdWkta2l0JztcclxuaW1wb3J0IHsgdjQgYXMgdXVpZCB9IGZyb20gJ3V1aWQnO1xyXG5cclxuaW1wb3J0IHR5cGUgeyBJQmxvY2sgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9uL3Vpa2l0JztcclxuXHJcbmV4cG9ydCBjbGFzcyBVSUhlbHBlciB7XHJcblx0LyoqXHJcblx0ICogQXNzaWduIGJsb2NrSWQsIGFwcElkIGFuZCBhY3Rpb25JZCB0byBldmVyeSBibG9jay9lbGVtZW50IGluc2lkZSB0aGUgYXJyYXlcclxuXHQgKiBAcGFyYW0gYmxvY2tzIHRoZSBibG9ja3MgdGhhdCB3aWxsIGJlIGl0ZXJhdGVkIGFuZCBhc3NpZ25lZCB0aGUgaWRzXHJcblx0ICogQHBhcmFtIGFwcElkIHRoZSBhcHBJZCB0aGF0IHdpbGwgYmUgYXNzaWduZWQgdG9cclxuXHQgKiBAcmV0dXJucyB0aGUgYXJyYXkgb2YgYmxvY2sgd2l0aCB0aGUgaWRzIHByb3BlcnRpZXMgYXNzaWduZWRcclxuXHQgKi9cclxuXHRwdWJsaWMgc3RhdGljIGFzc2lnbklkcyhibG9ja3M6IEFycmF5PElCbG9jayB8IExheW91dEJsb2NrPiwgYXBwSWQ6IHN0cmluZyk6IEFycmF5PElCbG9jayB8IExheW91dEJsb2NrPiB7XHJcblx0XHRibG9ja3MuZm9yRWFjaCgoYmxvY2s6IChJQmxvY2sgfCBMYXlvdXRCbG9jaykgJiB7IGFwcElkPzogc3RyaW5nOyBibG9ja0lkPzogc3RyaW5nOyBlbGVtZW50cz86IEFycmF5PGFueT4gfSkgPT4ge1xyXG5cdFx0XHRpZiAoIWJsb2NrLmFwcElkKSB7XHJcblx0XHRcdFx0YmxvY2suYXBwSWQgPSBhcHBJZDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWJsb2NrLmJsb2NrSWQpIHtcclxuXHRcdFx0XHRibG9jay5ibG9ja0lkID0gdXVpZCgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChibG9jay5lbGVtZW50cykge1xyXG5cdFx0XHRcdGJsb2NrLmVsZW1lbnRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcclxuXHRcdFx0XHRcdGlmICghZWxlbWVudC5hY3Rpb25JZCkge1xyXG5cdFx0XHRcdFx0XHRlbGVtZW50LmFjdGlvbklkID0gdXVpZCgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gYmxvY2tzO1xyXG5cdH1cclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxNQUFNLElBQUksUUFBUSxPQUFPO0FBSWxDLE9BQU8sTUFBTTtFQUNaOzs7OztFQUtDLEdBQ0QsT0FBYyxVQUFVLE1BQW1DLEVBQUUsS0FBYSxFQUErQjtJQUN4RyxPQUFPLE9BQU8sQ0FBQyxDQUFDO01BQ2YsSUFBSSxDQUFDLE1BQU0sS0FBSyxFQUFFO1FBQ2pCLE1BQU0sS0FBSyxHQUFHO01BQ2Y7TUFDQSxJQUFJLENBQUMsTUFBTSxPQUFPLEVBQUU7UUFDbkIsTUFBTSxPQUFPLEdBQUc7TUFDakI7TUFDQSxJQUFJLE1BQU0sUUFBUSxFQUFFO1FBQ25CLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1VBQ3ZCLElBQUksQ0FBQyxRQUFRLFFBQVEsRUFBRTtZQUN0QixRQUFRLFFBQVEsR0FBRztVQUNwQjtRQUNEO01BQ0Q7SUFDRDtJQUVBLE9BQU87RUFDUjtBQUNEIn0=
// denoCacheMetadata=14286194369992828345,3682814022212108650