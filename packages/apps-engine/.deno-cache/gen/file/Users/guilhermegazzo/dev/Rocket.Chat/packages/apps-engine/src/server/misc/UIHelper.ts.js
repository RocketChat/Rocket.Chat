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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9zZXJ2ZXIvbWlzYy9VSUhlbHBlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IExheW91dEJsb2NrIH0gZnJvbSAnQHJvY2tldC5jaGF0L3VpLWtpdCc7XG5pbXBvcnQgeyB2NCBhcyB1dWlkIH0gZnJvbSAndXVpZCc7XG5cbmltcG9ydCB0eXBlIHsgSUJsb2NrIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbi91aWtpdCc7XG5cbmV4cG9ydCBjbGFzcyBVSUhlbHBlciB7XG4gICAgLyoqXG4gICAgICogQXNzaWduIGJsb2NrSWQsIGFwcElkIGFuZCBhY3Rpb25JZCB0byBldmVyeSBibG9jay9lbGVtZW50IGluc2lkZSB0aGUgYXJyYXlcbiAgICAgKiBAcGFyYW0gYmxvY2tzIHRoZSBibG9ja3MgdGhhdCB3aWxsIGJlIGl0ZXJhdGVkIGFuZCBhc3NpZ25lZCB0aGUgaWRzXG4gICAgICogQHBhcmFtIGFwcElkIHRoZSBhcHBJZCB0aGF0IHdpbGwgYmUgYXNzaWduZWQgdG9cbiAgICAgKiBAcmV0dXJucyB0aGUgYXJyYXkgb2YgYmxvY2sgd2l0aCB0aGUgaWRzIHByb3BlcnRpZXMgYXNzaWduZWRcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzc2lnbklkcyhibG9ja3M6IEFycmF5PElCbG9jayB8IExheW91dEJsb2NrPiwgYXBwSWQ6IHN0cmluZyk6IEFycmF5PElCbG9jayB8IExheW91dEJsb2NrPiB7XG4gICAgICAgIGJsb2Nrcy5mb3JFYWNoKChibG9jazogKElCbG9jayB8IExheW91dEJsb2NrKSAmIHsgYXBwSWQ/OiBzdHJpbmc7IGJsb2NrSWQ/OiBzdHJpbmc7IGVsZW1lbnRzPzogQXJyYXk8YW55PiB9KSA9PiB7XG4gICAgICAgICAgICBpZiAoIWJsb2NrLmFwcElkKSB7XG4gICAgICAgICAgICAgICAgYmxvY2suYXBwSWQgPSBhcHBJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYmxvY2suYmxvY2tJZCkge1xuICAgICAgICAgICAgICAgIGJsb2NrLmJsb2NrSWQgPSB1dWlkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYmxvY2suZWxlbWVudHMpIHtcbiAgICAgICAgICAgICAgICBibG9jay5lbGVtZW50cy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZWxlbWVudC5hY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hY3Rpb25JZCA9IHV1aWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYmxvY2tzO1xuICAgIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLE1BQU0sSUFBSSxRQUFRLE9BQU87QUFJbEMsT0FBTyxNQUFNO0VBQ1Q7Ozs7O0tBS0MsR0FDRCxPQUFjLFVBQVUsTUFBbUMsRUFBRSxLQUFhLEVBQStCO0lBQ3JHLE9BQU8sT0FBTyxDQUFDLENBQUM7TUFDWixJQUFJLENBQUMsTUFBTSxLQUFLLEVBQUU7UUFDZCxNQUFNLEtBQUssR0FBRztNQUNsQjtNQUNBLElBQUksQ0FBQyxNQUFNLE9BQU8sRUFBRTtRQUNoQixNQUFNLE9BQU8sR0FBRztNQUNwQjtNQUNBLElBQUksTUFBTSxRQUFRLEVBQUU7UUFDaEIsTUFBTSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7VUFDcEIsSUFBSSxDQUFDLFFBQVEsUUFBUSxFQUFFO1lBQ25CLFFBQVEsUUFBUSxHQUFHO1VBQ3ZCO1FBQ0o7TUFDSjtJQUNKO0lBRUEsT0FBTztFQUNYO0FBQ0oifQ==