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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9zcmMvc2VydmVyL21pc2MvVUlIZWxwZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBMYXlvdXRCbG9jayB9IGZyb20gJ0Byb2NrZXQuY2hhdC91aS1raXQnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZCB9IGZyb20gJ3V1aWQnO1xuXG5pbXBvcnQgdHlwZSB7IElCbG9jayB9IGZyb20gJy4uLy4uL2RlZmluaXRpb24vdWlraXQnO1xuXG5leHBvcnQgY2xhc3MgVUlIZWxwZXIge1xuICAgIC8qKlxuICAgICAqIEFzc2lnbiBibG9ja0lkLCBhcHBJZCBhbmQgYWN0aW9uSWQgdG8gZXZlcnkgYmxvY2svZWxlbWVudCBpbnNpZGUgdGhlIGFycmF5XG4gICAgICogQHBhcmFtIGJsb2NrcyB0aGUgYmxvY2tzIHRoYXQgd2lsbCBiZSBpdGVyYXRlZCBhbmQgYXNzaWduZWQgdGhlIGlkc1xuICAgICAqIEBwYXJhbSBhcHBJZCB0aGUgYXBwSWQgdGhhdCB3aWxsIGJlIGFzc2lnbmVkIHRvXG4gICAgICogQHJldHVybnMgdGhlIGFycmF5IG9mIGJsb2NrIHdpdGggdGhlIGlkcyBwcm9wZXJ0aWVzIGFzc2lnbmVkXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3NpZ25JZHMoYmxvY2tzOiBBcnJheTxJQmxvY2sgfCBMYXlvdXRCbG9jaz4sIGFwcElkOiBzdHJpbmcpOiBBcnJheTxJQmxvY2sgfCBMYXlvdXRCbG9jaz4ge1xuICAgICAgICBibG9ja3MuZm9yRWFjaCgoYmxvY2s6IChJQmxvY2sgfCBMYXlvdXRCbG9jaykgJiB7IGFwcElkPzogc3RyaW5nOyBibG9ja0lkPzogc3RyaW5nOyBlbGVtZW50cz86IEFycmF5PGFueT4gfSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFibG9jay5hcHBJZCkge1xuICAgICAgICAgICAgICAgIGJsb2NrLmFwcElkID0gYXBwSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWJsb2NrLmJsb2NrSWQpIHtcbiAgICAgICAgICAgICAgICBibG9jay5ibG9ja0lkID0gdXVpZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGJsb2NrLmVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgYmxvY2suZWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWVsZW1lbnQuYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWN0aW9uSWQgPSB1dWlkKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGJsb2NrcztcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxNQUFNLElBQUksUUFBUSxPQUFPO0FBSWxDLE9BQU8sTUFBTTtFQUNUOzs7OztLQUtDLEdBQ0QsT0FBYyxVQUFVLE1BQW1DLEVBQUUsS0FBYSxFQUErQjtJQUNyRyxPQUFPLE9BQU8sQ0FBQyxDQUFDO01BQ1osSUFBSSxDQUFDLE1BQU0sS0FBSyxFQUFFO1FBQ2QsTUFBTSxLQUFLLEdBQUc7TUFDbEI7TUFDQSxJQUFJLENBQUMsTUFBTSxPQUFPLEVBQUU7UUFDaEIsTUFBTSxPQUFPLEdBQUc7TUFDcEI7TUFDQSxJQUFJLE1BQU0sUUFBUSxFQUFFO1FBQ2hCLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1VBQ3BCLElBQUksQ0FBQyxRQUFRLFFBQVEsRUFBRTtZQUNuQixRQUFRLFFBQVEsR0FBRztVQUN2QjtRQUNKO01BQ0o7SUFDSjtJQUVBLE9BQU87RUFDWDtBQUNKIn0=