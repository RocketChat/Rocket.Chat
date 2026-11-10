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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdmFyL2ZvbGRlcnMvcHQvNnBqM3hjMzk3ZzkxZF9qa3F6eDdtbmp3MDAwMGduL1QvYXBwcy1lbmdpbmUtdGVtcC9kZW5vLXJ1bnRpbWUvbGliL2FjY2Vzc29ycy9tb2RpZnkvTW9kaWZ5RXh0ZW5kZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJTW9kaWZ5RXh0ZW5kZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSU1vZGlmeUV4dGVuZGVyLnRzJztcbmltcG9ydCB0eXBlIHsgSU1lc3NhZ2UgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9tZXNzYWdlcy9JTWVzc2FnZS50cyc7XG5pbXBvcnQgdHlwZSB7IElNZXNzYWdlRXh0ZW5kZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSU1lc3NhZ2VFeHRlbmRlci50cyc7XG5pbXBvcnQgdHlwZSB7IElSb29tRXh0ZW5kZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSVJvb21FeHRlbmRlci50cyc7XG5pbXBvcnQgdHlwZSB7IElWaWRlb0NvbmZlcmVuY2VFeHRlbmRlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JVmlkZW9Db25mZXJlbmNlRXh0ZW5kLnRzJztcbmltcG9ydCB0eXBlIHsgSVVzZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi91c2Vycy9JVXNlci50cyc7XG5pbXBvcnQgdHlwZSB7IFZpZGVvQ29uZmVyZW5jZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3ZpZGVvQ29uZmVyZW5jZXMvSVZpZGVvQ29uZmVyZW5jZS50cyc7XG5pbXBvcnQgdHlwZSB7IElSb29tIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vcm9vbXMvSVJvb20udHMnO1xuaW1wb3J0IHR5cGUgeyBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbCBhcyBfUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9tZXRhZGF0YS9Sb2NrZXRDaGF0QXNzb2NpYXRpb25zLnRzJztcblxuaW1wb3J0ICogYXMgTWVzc2VuZ2VyIGZyb20gJy4uLy4uL21lc3Nlbmdlci50cyc7XG5pbXBvcnQgeyBBcHBPYmplY3RSZWdpc3RyeSB9IGZyb20gJy4uLy4uLy4uL0FwcE9iamVjdFJlZ2lzdHJ5LnRzJztcbmltcG9ydCB7IE1lc3NhZ2VFeHRlbmRlciB9IGZyb20gJy4uL2V4dGVuZGVycy9NZXNzYWdlRXh0ZW5kZXIudHMnO1xuaW1wb3J0IHsgUm9vbUV4dGVuZGVyIH0gZnJvbSAnLi4vZXh0ZW5kZXJzL1Jvb21FeHRlbmRlci50cyc7XG5pbXBvcnQgeyBWaWRlb0NvbmZlcmVuY2VFeHRlbmRlciB9IGZyb20gJy4uL2V4dGVuZGVycy9WaWRlb0NvbmZlcmVuY2VFeHRlbmQudHMnO1xuaW1wb3J0IHsgcmVxdWlyZSB9IGZyb20gJy4uLy4uLy4uL2xpYi9yZXF1aXJlLnRzJztcbmltcG9ydCB7IGZvcm1hdEVycm9yUmVzcG9uc2UgfSBmcm9tICcuLi9mb3JtYXRSZXNwb25zZUVycm9ySGFuZGxlci50cyc7XG5cbmNvbnN0IHsgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwgfSA9IHJlcXVpcmUoJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL21ldGFkYXRhL1JvY2tldENoYXRBc3NvY2lhdGlvbnMuanMnKSBhcyB7XG5cdFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsOiB0eXBlb2YgX1JvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsO1xufTtcblxuZXhwb3J0IGNsYXNzIE1vZGlmeUV4dGVuZGVyIGltcGxlbWVudHMgSU1vZGlmeUV4dGVuZGVyIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBzZW5kZXJGbjogdHlwZW9mIE1lc3Nlbmdlci5zZW5kUmVxdWVzdCkge31cblxuXHRwdWJsaWMgYXN5bmMgZXh0ZW5kTWVzc2FnZShtZXNzYWdlSWQ6IHN0cmluZywgdXBkYXRlcjogSVVzZXIpOiBQcm9taXNlPElNZXNzYWdlRXh0ZW5kZXI+IHtcblx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNlbmRlckZuKHtcblx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0TWVzc2FnZUJyaWRnZTpkb0dldEJ5SWQnLFxuXHRcdFx0cGFyYW1zOiBbbWVzc2FnZUlkLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IG1zZyA9IHJlc3VsdC5yZXN1bHQgYXMgSU1lc3NhZ2U7XG5cblx0XHRtc2cuZWRpdG9yID0gdXBkYXRlcjtcblx0XHRtc2cuZWRpdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXG5cdFx0cmV0dXJuIG5ldyBNZXNzYWdlRXh0ZW5kZXIobXNnKTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBleHRlbmRSb29tKHJvb21JZDogc3RyaW5nLCBfdXBkYXRlcjogSVVzZXIpOiBQcm9taXNlPElSb29tRXh0ZW5kZXI+IHtcblx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNlbmRlckZuKHtcblx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0Um9vbUJyaWRnZTpkb0dldEJ5SWQnLFxuXHRcdFx0cGFyYW1zOiBbcm9vbUlkLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IHJvb20gPSByZXN1bHQucmVzdWx0IGFzIElSb29tO1xuXG5cdFx0cm9vbS51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXG5cdFx0cmV0dXJuIG5ldyBSb29tRXh0ZW5kZXIocm9vbSk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZXh0ZW5kVmlkZW9Db25mZXJlbmNlKGlkOiBzdHJpbmcpOiBQcm9taXNlPElWaWRlb0NvbmZlcmVuY2VFeHRlbmRlcj4ge1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRWaWRlb0NvbmZlcmVuY2VCcmlkZ2U6ZG9HZXRCeUlkJyxcblx0XHRcdHBhcmFtczogW2lkLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IGNhbGwgPSByZXN1bHQucmVzdWx0IGFzIFZpZGVvQ29uZmVyZW5jZTtcblxuXHRcdGNhbGwuX3VwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cblx0XHRyZXR1cm4gbmV3IFZpZGVvQ29uZmVyZW5jZUV4dGVuZGVyKGNhbGwpO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGZpbmlzaChleHRlbmRlcjogSU1lc3NhZ2VFeHRlbmRlciB8IElSb29tRXh0ZW5kZXIgfCBJVmlkZW9Db25mZXJlbmNlRXh0ZW5kZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRzd2l0Y2ggKGV4dGVuZGVyLmtpbmQpIHtcblx0XHRcdGNhc2UgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwuTUVTU0FHRTpcblx0XHRcdFx0YXdhaXQgdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRNZXNzYWdlQnJpZGdlOmRvVXBkYXRlJyxcblx0XHRcdFx0XHRwYXJhbXM6IFsoZXh0ZW5kZXIgYXMgSU1lc3NhZ2VFeHRlbmRlcikuZ2V0TWVzc2FnZSgpLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdFx0XHR9KS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsLlJPT006XG5cdFx0XHRcdGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0Um9vbUJyaWRnZTpkb1VwZGF0ZScsXG5cdFx0XHRcdFx0cGFyYW1zOiBbXG5cdFx0XHRcdFx0XHQoZXh0ZW5kZXIgYXMgSVJvb21FeHRlbmRlcikuZ2V0Um9vbSgpLFxuXHRcdFx0XHRcdFx0KGV4dGVuZGVyIGFzIElSb29tRXh0ZW5kZXIpLmdldFVzZXJuYW1lc09mTWVtYmVyc0JlaW5nQWRkZWQoKSxcblx0XHRcdFx0XHRcdEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHR9KS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsLlZJREVPX0NPTkZFUkVOQ0U6XG5cdFx0XHRcdGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0VmlkZW9Db25mZXJlbmNlQnJpZGdlOmRvVXBkYXRlJyxcblx0XHRcdFx0XHRwYXJhbXM6IFsoZXh0ZW5kZXIgYXMgSVZpZGVvQ29uZmVyZW5jZUV4dGVuZGVyKS5nZXRWaWRlb0NvbmZlcmVuY2UoKSwgQXBwT2JqZWN0UmVnaXN0cnkuZ2V0KCdpZCcpXSxcblx0XHRcdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGV4dGVuZGVyIHBhc3NlZCB0byB0aGUgTW9kaWZ5RXh0ZW5kZXIuZmluaXNoIGZ1bmN0aW9uLicpO1xuXHRcdH1cblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVdBLFNBQVMsaUJBQWlCLFFBQVEsZ0NBQWdDO0FBQ2xFLFNBQVMsZUFBZSxRQUFRLGtDQUFrQztBQUNsRSxTQUFTLFlBQVksUUFBUSwrQkFBK0I7QUFDNUQsU0FBUyx1QkFBdUIsUUFBUSx3Q0FBd0M7QUFDaEYsU0FBUyxPQUFPLFFBQVEsMEJBQTBCO0FBQ2xELFNBQVMsbUJBQW1CLFFBQVEsbUNBQW1DO0FBRXZFLE1BQU0sRUFBRSwwQkFBMEIsRUFBRSxHQUFHLFFBQVE7QUFJL0MsT0FBTyxNQUFNOztFQUNaLFlBQVksQUFBaUIsUUFBc0MsQ0FBRTtTQUF4QyxXQUFBO0VBQXlDO0VBRXRFLE1BQWEsY0FBYyxTQUFpQixFQUFFLE9BQWMsRUFBNkI7SUFDeEYsTUFBTSxTQUFTLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQztNQUNsQyxRQUFRO01BQ1IsUUFBUTtRQUFDO1FBQVcsa0JBQWtCLEdBQUcsQ0FBQztPQUFNO0lBQ2pELEdBQUcsS0FBSyxDQUFDLENBQUM7TUFDVCxNQUFNLG9CQUFvQjtJQUMzQjtJQUVBLE1BQU0sTUFBTSxPQUFPLE1BQU07SUFFekIsSUFBSSxNQUFNLEdBQUc7SUFDYixJQUFJLFFBQVEsR0FBRyxJQUFJO0lBRW5CLE9BQU8sSUFBSSxnQkFBZ0I7RUFDNUI7RUFFQSxNQUFhLFdBQVcsTUFBYyxFQUFFLFFBQWUsRUFBMEI7SUFDaEYsTUFBTSxTQUFTLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQztNQUNsQyxRQUFRO01BQ1IsUUFBUTtRQUFDO1FBQVEsa0JBQWtCLEdBQUcsQ0FBQztPQUFNO0lBQzlDLEdBQUcsS0FBSyxDQUFDLENBQUM7TUFDVCxNQUFNLG9CQUFvQjtJQUMzQjtJQUVBLE1BQU0sT0FBTyxPQUFPLE1BQU07SUFFMUIsS0FBSyxTQUFTLEdBQUcsSUFBSTtJQUVyQixPQUFPLElBQUksYUFBYTtFQUN6QjtFQUVBLE1BQWEsc0JBQXNCLEVBQVUsRUFBcUM7SUFDakYsTUFBTSxTQUFTLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQztNQUNsQyxRQUFRO01BQ1IsUUFBUTtRQUFDO1FBQUksa0JBQWtCLEdBQUcsQ0FBQztPQUFNO0lBQzFDLEdBQUcsS0FBSyxDQUFDLENBQUM7TUFDVCxNQUFNLG9CQUFvQjtJQUMzQjtJQUVBLE1BQU0sT0FBTyxPQUFPLE1BQU07SUFFMUIsS0FBSyxVQUFVLEdBQUcsSUFBSTtJQUV0QixPQUFPLElBQUksd0JBQXdCO0VBQ3BDO0VBRUEsTUFBYSxPQUFPLFFBQXFFLEVBQWlCO0lBQ3pHLE9BQVEsU0FBUyxJQUFJO01BQ3BCLEtBQUssMkJBQTJCLE9BQU87UUFDdEMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDO1VBQ25CLFFBQVE7VUFDUixRQUFRO1lBQUUsU0FBOEIsVUFBVTtZQUFJLGtCQUFrQixHQUFHLENBQUM7V0FBTTtRQUNuRixHQUFHLEtBQUssQ0FBQyxDQUFDO1VBQ1QsTUFBTSxvQkFBb0I7UUFDM0I7UUFDQTtNQUNELEtBQUssMkJBQTJCLElBQUk7UUFDbkMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDO1VBQ25CLFFBQVE7VUFDUixRQUFRO1lBQ04sU0FBMkIsT0FBTztZQUNsQyxTQUEyQiwrQkFBK0I7WUFDM0Qsa0JBQWtCLEdBQUcsQ0FBQztXQUN0QjtRQUNGLEdBQUcsS0FBSyxDQUFDLENBQUM7VUFDVCxNQUFNLG9CQUFvQjtRQUMzQjtRQUNBO01BQ0QsS0FBSywyQkFBMkIsZ0JBQWdCO1FBQy9DLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQztVQUNuQixRQUFRO1VBQ1IsUUFBUTtZQUFFLFNBQXNDLGtCQUFrQjtZQUFJLGtCQUFrQixHQUFHLENBQUM7V0FBTTtRQUNuRyxHQUFHLEtBQUssQ0FBQyxDQUFDO1VBQ1QsTUFBTSxvQkFBb0I7UUFDM0I7UUFDQTtNQUNEO1FBQ0MsTUFBTSxJQUFJLE1BQU07SUFDbEI7RUFDRDtBQUNEIn0=
// denoCacheMetadata=4666636458113148546,3270655643487068272