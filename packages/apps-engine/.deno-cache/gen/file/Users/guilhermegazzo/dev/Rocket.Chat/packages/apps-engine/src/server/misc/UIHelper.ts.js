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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9zZXJ2ZXIvbWlzYy9VSUhlbHBlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IExheW91dEJsb2NrIH0gZnJvbSAnQHJvY2tldC5jaGF0L3VpLWtpdCc7XG5pbXBvcnQgeyB2NCBhcyB1dWlkIH0gZnJvbSAndXVpZCc7XG5cbmltcG9ydCB0eXBlIHsgSUJsb2NrIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbi91aWtpdCc7XG5cbmV4cG9ydCBjbGFzcyBVSUhlbHBlciB7XG5cdC8qKlxuXHQgKiBBc3NpZ24gYmxvY2tJZCwgYXBwSWQgYW5kIGFjdGlvbklkIHRvIGV2ZXJ5IGJsb2NrL2VsZW1lbnQgaW5zaWRlIHRoZSBhcnJheVxuXHQgKiBAcGFyYW0gYmxvY2tzIHRoZSBibG9ja3MgdGhhdCB3aWxsIGJlIGl0ZXJhdGVkIGFuZCBhc3NpZ25lZCB0aGUgaWRzXG5cdCAqIEBwYXJhbSBhcHBJZCB0aGUgYXBwSWQgdGhhdCB3aWxsIGJlIGFzc2lnbmVkIHRvXG5cdCAqIEByZXR1cm5zIHRoZSBhcnJheSBvZiBibG9jayB3aXRoIHRoZSBpZHMgcHJvcGVydGllcyBhc3NpZ25lZFxuXHQgKi9cblx0cHVibGljIHN0YXRpYyBhc3NpZ25JZHMoYmxvY2tzOiBBcnJheTxJQmxvY2sgfCBMYXlvdXRCbG9jaz4sIGFwcElkOiBzdHJpbmcpOiBBcnJheTxJQmxvY2sgfCBMYXlvdXRCbG9jaz4ge1xuXHRcdGJsb2Nrcy5mb3JFYWNoKChibG9jazogKElCbG9jayB8IExheW91dEJsb2NrKSAmIHsgYXBwSWQ/OiBzdHJpbmc7IGJsb2NrSWQ/OiBzdHJpbmc7IGVsZW1lbnRzPzogQXJyYXk8YW55PiB9KSA9PiB7XG5cdFx0XHRpZiAoIWJsb2NrLmFwcElkKSB7XG5cdFx0XHRcdGJsb2NrLmFwcElkID0gYXBwSWQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWJsb2NrLmJsb2NrSWQpIHtcblx0XHRcdFx0YmxvY2suYmxvY2tJZCA9IHV1aWQoKTtcblx0XHRcdH1cblx0XHRcdGlmIChibG9jay5lbGVtZW50cykge1xuXHRcdFx0XHRibG9jay5lbGVtZW50cy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFlbGVtZW50LmFjdGlvbklkKSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmFjdGlvbklkID0gdXVpZCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gYmxvY2tzO1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxNQUFNLElBQUksUUFBUSxPQUFPO0FBSWxDLE9BQU8sTUFBTTtFQUNaOzs7OztFQUtDLEdBQ0QsT0FBYyxVQUFVLE1BQW1DLEVBQUUsS0FBYSxFQUErQjtJQUN4RyxPQUFPLE9BQU8sQ0FBQyxDQUFDO01BQ2YsSUFBSSxDQUFDLE1BQU0sS0FBSyxFQUFFO1FBQ2pCLE1BQU0sS0FBSyxHQUFHO01BQ2Y7TUFDQSxJQUFJLENBQUMsTUFBTSxPQUFPLEVBQUU7UUFDbkIsTUFBTSxPQUFPLEdBQUc7TUFDakI7TUFDQSxJQUFJLE1BQU0sUUFBUSxFQUFFO1FBQ25CLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1VBQ3ZCLElBQUksQ0FBQyxRQUFRLFFBQVEsRUFBRTtZQUN0QixRQUFRLFFBQVEsR0FBRztVQUNwQjtRQUNEO01BQ0Q7SUFDRDtJQUVBLE9BQU87RUFDUjtBQUNEIn0=
// denoCacheMetadata=18434549357812369877,16338102733100003786