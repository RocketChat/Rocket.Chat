import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';
import { MessageExtender } from '../extenders/MessageExtender.ts';
import { RoomExtender } from '../extenders/RoomExtender.ts';
import { VideoConferenceExtender } from '../extenders/VideoConferenceExtend.ts';
import { require } from '../../../lib/require.ts';
import { formatErrorResponse } from '../formatResponseErrorHandler.ts';
const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js');
export class ModifyExtender {
  senderFn;
  constructor(senderFn){
    this.senderFn = senderFn;
  }
  async extendMessage(messageId, updater) {
    const result = await this.senderFn({
      method: 'bridges:getMessageBridge:doGetById',
      params: [
        messageId,
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    const msg = result.result;
    msg.editor = updater;
    msg.editedAt = new Date();
    return new MessageExtender(msg);
  }
  async extendRoom(roomId, _updater) {
    const result = await this.senderFn({
      method: 'bridges:getRoomBridge:doGetById',
      params: [
        roomId,
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    const room = result.result;
    room.updatedAt = new Date();
    return new RoomExtender(room);
  }
  async extendVideoConference(id) {
    const result = await this.senderFn({
      method: 'bridges:getVideoConferenceBridge:doGetById',
      params: [
        id,
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    const call = result.result;
    call._updatedAt = new Date();
    return new VideoConferenceExtender(call);
  }
  async finish(extender) {
    switch(extender.kind){
      case RocketChatAssociationModel.MESSAGE:
        await this.senderFn({
          method: 'bridges:getMessageBridge:doUpdate',
          params: [
            extender.getMessage(),
            AppObjectRegistry.get('id')
          ]
        }).catch((err)=>{
          throw formatErrorResponse(err);
        });
        break;
      case RocketChatAssociationModel.ROOM:
        await this.senderFn({
          method: 'bridges:getRoomBridge:doUpdate',
          params: [
            extender.getRoom(),
            extender.getUsernamesOfMembersBeingAdded(),
            AppObjectRegistry.get('id')
          ]
        }).catch((err)=>{
          throw formatErrorResponse(err);
        });
        break;
      case RocketChatAssociationModel.VIDEO_CONFERENCE:
        await this.senderFn({
          method: 'bridges:getVideoConferenceBridge:doUpdate',
          params: [
            extender.getVideoConference(),
            AppObjectRegistry.get('id')
          ]
        }).catch((err)=>{
          throw formatErrorResponse(err);
        });
        break;
      default:
        throw new Error('Invalid extender passed to the ModifyExtender.finish function.');
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L2l1c2VyL3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9saWIvYWNjZXNzb3JzL21vZGlmeS9Nb2RpZnlFeHRlbmRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElNb2RpZnlFeHRlbmRlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JTW9kaWZ5RXh0ZW5kZXIudHMnO1xuaW1wb3J0IHR5cGUgeyBJTWVzc2FnZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL21lc3NhZ2VzL0lNZXNzYWdlLnRzJztcbmltcG9ydCB0eXBlIHsgSU1lc3NhZ2VFeHRlbmRlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JTWVzc2FnZUV4dGVuZGVyLnRzJztcbmltcG9ydCB0eXBlIHsgSVJvb21FeHRlbmRlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JUm9vbUV4dGVuZGVyLnRzJztcbmltcG9ydCB0eXBlIHsgSVZpZGVvQ29uZmVyZW5jZUV4dGVuZGVyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lWaWRlb0NvbmZlcmVuY2VFeHRlbmQudHMnO1xuaW1wb3J0IHR5cGUgeyBJVXNlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3VzZXJzL0lVc2VyLnRzJztcbmltcG9ydCB0eXBlIHsgVmlkZW9Db25mZXJlbmNlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vdmlkZW9Db25mZXJlbmNlcy9JVmlkZW9Db25mZXJlbmNlLnRzJztcbmltcG9ydCB0eXBlIHsgSVJvb20gfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9yb29tcy9JUm9vbS50cyc7XG5pbXBvcnQgdHlwZSB7IFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsIGFzIF9Sb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL21ldGFkYXRhL1JvY2tldENoYXRBc3NvY2lhdGlvbnMudHMnO1xuXG5pbXBvcnQgKiBhcyBNZXNzZW5nZXIgZnJvbSAnLi4vLi4vbWVzc2VuZ2VyLnRzJztcbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xuaW1wb3J0IHsgTWVzc2FnZUV4dGVuZGVyIH0gZnJvbSAnLi4vZXh0ZW5kZXJzL01lc3NhZ2VFeHRlbmRlci50cyc7XG5pbXBvcnQgeyBSb29tRXh0ZW5kZXIgfSBmcm9tICcuLi9leHRlbmRlcnMvUm9vbUV4dGVuZGVyLnRzJztcbmltcG9ydCB7IFZpZGVvQ29uZmVyZW5jZUV4dGVuZGVyIH0gZnJvbSAnLi4vZXh0ZW5kZXJzL1ZpZGVvQ29uZmVyZW5jZUV4dGVuZC50cyc7XG5pbXBvcnQgeyByZXF1aXJlIH0gZnJvbSAnLi4vLi4vLi4vbGliL3JlcXVpcmUudHMnO1xuaW1wb3J0IHsgZm9ybWF0RXJyb3JSZXNwb25zZSB9IGZyb20gJy4uL2Zvcm1hdFJlc3BvbnNlRXJyb3JIYW5kbGVyLnRzJztcblxuY29uc3QgeyBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbCB9ID0gcmVxdWlyZSgnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vbWV0YWRhdGEvUm9ja2V0Q2hhdEFzc29jaWF0aW9ucy5qcycpIGFzIHtcblx0Um9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWw6IHR5cGVvZiBfUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWw7XG59O1xuXG5leHBvcnQgY2xhc3MgTW9kaWZ5RXh0ZW5kZXIgaW1wbGVtZW50cyBJTW9kaWZ5RXh0ZW5kZXIge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNlbmRlckZuOiB0eXBlb2YgTWVzc2VuZ2VyLnNlbmRSZXF1ZXN0KSB7fVxuXG5cdHB1YmxpYyBhc3luYyBleHRlbmRNZXNzYWdlKG1lc3NhZ2VJZDogc3RyaW5nLCB1cGRhdGVyOiBJVXNlcik6IFByb21pc2U8SU1lc3NhZ2VFeHRlbmRlcj4ge1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRNZXNzYWdlQnJpZGdlOmRvR2V0QnlJZCcsXG5cdFx0XHRwYXJhbXM6IFttZXNzYWdlSWQsIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgbXNnID0gcmVzdWx0LnJlc3VsdCBhcyBJTWVzc2FnZTtcblxuXHRcdG1zZy5lZGl0b3IgPSB1cGRhdGVyO1xuXHRcdG1zZy5lZGl0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cblx0XHRyZXR1cm4gbmV3IE1lc3NhZ2VFeHRlbmRlcihtc2cpO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGV4dGVuZFJvb20ocm9vbUlkOiBzdHJpbmcsIF91cGRhdGVyOiBJVXNlcik6IFByb21pc2U8SVJvb21FeHRlbmRlcj4ge1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRSb29tQnJpZGdlOmRvR2V0QnlJZCcsXG5cdFx0XHRwYXJhbXM6IFtyb29tSWQsIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IHJlc3VsdC5yZXN1bHQgYXMgSVJvb207XG5cblx0XHRyb29tLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cblx0XHRyZXR1cm4gbmV3IFJvb21FeHRlbmRlcihyb29tKTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBleHRlbmRWaWRlb0NvbmZlcmVuY2UoaWQ6IHN0cmluZyk6IFByb21pc2U8SVZpZGVvQ29uZmVyZW5jZUV4dGVuZGVyPiB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRtZXRob2Q6ICdicmlkZ2VzOmdldFZpZGVvQ29uZmVyZW5jZUJyaWRnZTpkb0dldEJ5SWQnLFxuXHRcdFx0cGFyYW1zOiBbaWQsIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgY2FsbCA9IHJlc3VsdC5yZXN1bHQgYXMgVmlkZW9Db25mZXJlbmNlO1xuXG5cdFx0Y2FsbC5fdXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcblxuXHRcdHJldHVybiBuZXcgVmlkZW9Db25mZXJlbmNlRXh0ZW5kZXIoY2FsbCk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZmluaXNoKGV4dGVuZGVyOiBJTWVzc2FnZUV4dGVuZGVyIHwgSVJvb21FeHRlbmRlciB8IElWaWRlb0NvbmZlcmVuY2VFeHRlbmRlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHN3aXRjaCAoZXh0ZW5kZXIua2luZCkge1xuXHRcdFx0Y2FzZSBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbC5NRVNTQUdFOlxuXHRcdFx0XHRhd2FpdCB0aGlzLnNlbmRlckZuKHtcblx0XHRcdFx0XHRtZXRob2Q6ICdicmlkZ2VzOmdldE1lc3NhZ2VCcmlkZ2U6ZG9VcGRhdGUnLFxuXHRcdFx0XHRcdHBhcmFtczogWyhleHRlbmRlciBhcyBJTWVzc2FnZUV4dGVuZGVyKS5nZXRNZXNzYWdlKCksIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0XHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwuUk9PTTpcblx0XHRcdFx0YXdhaXQgdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRSb29tQnJpZGdlOmRvVXBkYXRlJyxcblx0XHRcdFx0XHRwYXJhbXM6IFtcblx0XHRcdFx0XHRcdChleHRlbmRlciBhcyBJUm9vbUV4dGVuZGVyKS5nZXRSb29tKCksXG5cdFx0XHRcdFx0XHQoZXh0ZW5kZXIgYXMgSVJvb21FeHRlbmRlcikuZ2V0VXNlcm5hbWVzT2ZNZW1iZXJzQmVpbmdBZGRlZCgpLFxuXHRcdFx0XHRcdFx0QXBwT2JqZWN0UmVnaXN0cnkuZ2V0KCdpZCcpLFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwuVklERU9fQ09ORkVSRU5DRTpcblx0XHRcdFx0YXdhaXQgdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRWaWRlb0NvbmZlcmVuY2VCcmlkZ2U6ZG9VcGRhdGUnLFxuXHRcdFx0XHRcdHBhcmFtczogWyhleHRlbmRlciBhcyBJVmlkZW9Db25mZXJlbmNlRXh0ZW5kZXIpLmdldFZpZGVvQ29uZmVyZW5jZSgpLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdFx0XHR9KS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZXh0ZW5kZXIgcGFzc2VkIHRvIHRoZSBNb2RpZnlFeHRlbmRlci5maW5pc2ggZnVuY3Rpb24uJyk7XG5cdFx0fVxuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBV0EsU0FBUyxpQkFBaUIsUUFBUSxnQ0FBZ0M7QUFDbEUsU0FBUyxlQUFlLFFBQVEsa0NBQWtDO0FBQ2xFLFNBQVMsWUFBWSxRQUFRLCtCQUErQjtBQUM1RCxTQUFTLHVCQUF1QixRQUFRLHdDQUF3QztBQUNoRixTQUFTLE9BQU8sUUFBUSwwQkFBMEI7QUFDbEQsU0FBUyxtQkFBbUIsUUFBUSxtQ0FBbUM7QUFFdkUsTUFBTSxFQUFFLDBCQUEwQixFQUFFLEdBQUcsUUFBUTtBQUkvQyxPQUFPLE1BQU07O0VBQ1osWUFBWSxBQUFpQixRQUFzQyxDQUFFO1NBQXhDLFdBQUE7RUFBeUM7RUFFdEUsTUFBYSxjQUFjLFNBQWlCLEVBQUUsT0FBYyxFQUE2QjtJQUN4RixNQUFNLFNBQVMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDO01BQ2xDLFFBQVE7TUFDUixRQUFRO1FBQUM7UUFBVyxrQkFBa0IsR0FBRyxDQUFDO09BQU07SUFDakQsR0FBRyxLQUFLLENBQUMsQ0FBQztNQUNULE1BQU0sb0JBQW9CO0lBQzNCO0lBRUEsTUFBTSxNQUFNLE9BQU8sTUFBTTtJQUV6QixJQUFJLE1BQU0sR0FBRztJQUNiLElBQUksUUFBUSxHQUFHLElBQUk7SUFFbkIsT0FBTyxJQUFJLGdCQUFnQjtFQUM1QjtFQUVBLE1BQWEsV0FBVyxNQUFjLEVBQUUsUUFBZSxFQUEwQjtJQUNoRixNQUFNLFNBQVMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDO01BQ2xDLFFBQVE7TUFDUixRQUFRO1FBQUM7UUFBUSxrQkFBa0IsR0FBRyxDQUFDO09BQU07SUFDOUMsR0FBRyxLQUFLLENBQUMsQ0FBQztNQUNULE1BQU0sb0JBQW9CO0lBQzNCO0lBRUEsTUFBTSxPQUFPLE9BQU8sTUFBTTtJQUUxQixLQUFLLFNBQVMsR0FBRyxJQUFJO0lBRXJCLE9BQU8sSUFBSSxhQUFhO0VBQ3pCO0VBRUEsTUFBYSxzQkFBc0IsRUFBVSxFQUFxQztJQUNqRixNQUFNLFNBQVMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDO01BQ2xDLFFBQVE7TUFDUixRQUFRO1FBQUM7UUFBSSxrQkFBa0IsR0FBRyxDQUFDO09BQU07SUFDMUMsR0FBRyxLQUFLLENBQUMsQ0FBQztNQUNULE1BQU0sb0JBQW9CO0lBQzNCO0lBRUEsTUFBTSxPQUFPLE9BQU8sTUFBTTtJQUUxQixLQUFLLFVBQVUsR0FBRyxJQUFJO0lBRXRCLE9BQU8sSUFBSSx3QkFBd0I7RUFDcEM7RUFFQSxNQUFhLE9BQU8sUUFBcUUsRUFBaUI7SUFDekcsT0FBUSxTQUFTLElBQUk7TUFDcEIsS0FBSywyQkFBMkIsT0FBTztRQUN0QyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUM7VUFDbkIsUUFBUTtVQUNSLFFBQVE7WUFBRSxTQUE4QixVQUFVO1lBQUksa0JBQWtCLEdBQUcsQ0FBQztXQUFNO1FBQ25GLEdBQUcsS0FBSyxDQUFDLENBQUM7VUFDVCxNQUFNLG9CQUFvQjtRQUMzQjtRQUNBO01BQ0QsS0FBSywyQkFBMkIsSUFBSTtRQUNuQyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUM7VUFDbkIsUUFBUTtVQUNSLFFBQVE7WUFDTixTQUEyQixPQUFPO1lBQ2xDLFNBQTJCLCtCQUErQjtZQUMzRCxrQkFBa0IsR0FBRyxDQUFDO1dBQ3RCO1FBQ0YsR0FBRyxLQUFLLENBQUMsQ0FBQztVQUNULE1BQU0sb0JBQW9CO1FBQzNCO1FBQ0E7TUFDRCxLQUFLLDJCQUEyQixnQkFBZ0I7UUFDL0MsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDO1VBQ25CLFFBQVE7VUFDUixRQUFRO1lBQUUsU0FBc0Msa0JBQWtCO1lBQUksa0JBQWtCLEdBQUcsQ0FBQztXQUFNO1FBQ25HLEdBQUcsS0FBSyxDQUFDLENBQUM7VUFDVCxNQUFNLG9CQUFvQjtRQUMzQjtRQUNBO01BQ0Q7UUFDQyxNQUFNLElBQUksTUFBTTtJQUNsQjtFQUNEO0FBQ0QifQ==