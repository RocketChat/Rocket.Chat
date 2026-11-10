import { randomBytes } from 'node:crypto';
import { BlockBuilder } from '../builders/BlockBuilder.ts';
import { MessageBuilder } from '../builders/MessageBuilder.ts';
import { DiscussionBuilder } from '../builders/DiscussionBuilder.ts';
import { LivechatMessageBuilder } from '../builders/LivechatMessageBuilder.ts';
import { RoomBuilder } from '../builders/RoomBuilder.ts';
import { UserBuilder } from '../builders/UserBuilder.ts';
import { VideoConferenceBuilder } from '../builders/VideoConferenceBuilder.ts';
import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';
import { require } from '../../../lib/require.ts';
import { formatErrorResponse } from '../formatResponseErrorHandler.ts';
const { UIHelper } = require('@rocket.chat/apps-engine/server/misc/UIHelper.js');
const { RoomType } = require('@rocket.chat/apps-engine/definition/rooms/RoomType.js');
const { UserType } = require('@rocket.chat/apps-engine/definition/users/UserType.js');
const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js');
export class ModifyCreator {
  senderFn;
  constructor(senderFn){
    this.senderFn = senderFn;
  }
  getLivechatCreator() {
    return new Proxy({
      __kind: 'getLivechatCreator'
    }, {
      get: (_target, prop)=>{
        // It's not worthwhile to make an asynchronous request for such a simple method
        if (prop === 'createToken') {
          return ()=>randomBytes(16).toString('hex');
        }
        if (prop === 'toJSON') {
          return ()=>({});
        }
        return (...params)=>this.senderFn({
            method: `accessor:getModifier:getCreator:getLivechatCreator:${prop}`,
            params
          }).then((response)=>response.result).catch((err)=>{
            throw formatErrorResponse(err);
          });
      }
    });
  }
  getUploadCreator() {
    return new Proxy({
      __kind: 'getUploadCreator'
    }, {
      get: (_target, prop)=>(...params)=>prop === 'toJSON' ? {} : this.senderFn({
            method: `accessor:getModifier:getCreator:getUploadCreator:${prop}`,
            params
          }).then((response)=>response.result).catch((err)=>{
            throw formatErrorResponse(err);
          })
    });
  }
  getEmailCreator() {
    return new Proxy({
      __kind: 'getEmailCreator'
    }, {
      get: (_target, prop)=>(...params)=>prop === 'toJSON' ? {} : this.senderFn({
            method: `accessor:getModifier:getCreator:getEmailCreator:${prop}`,
            params
          }).then((response)=>response.result).catch((err)=>{
            throw formatErrorResponse(err);
          })
    });
  }
  getContactCreator() {
    return new Proxy({
      __kind: 'getContactCreator'
    }, {
      get: (_target, prop)=>(...params)=>prop === 'toJSON' ? {} : this.senderFn({
            method: `accessor:getModifier:getCreator:getContactCreator:${prop}`,
            params
          }).then((response)=>response.result).catch((err)=>{
            throw formatErrorResponse(err);
          })
    });
  }
  getBlockBuilder() {
    return new BlockBuilder();
  }
  startMessage(data) {
    if (data) {
      delete data.id;
    }
    return new MessageBuilder(data);
  }
  startLivechatMessage(data) {
    if (data) {
      delete data.id;
    }
    return new LivechatMessageBuilder(data);
  }
  startRoom(data) {
    if (data) {
      // @ts-ignore - this has been imported from the Apps-Engine
      delete data.id;
    }
    return new RoomBuilder(data);
  }
  startDiscussion(data) {
    if (data) {
      delete data.id;
    }
    return new DiscussionBuilder(data);
  }
  startVideoConference(data) {
    return new VideoConferenceBuilder(data);
  }
  startBotUser(data) {
    if (data) {
      delete data.id;
      const { roles } = data;
      if (roles?.length) {
        const hasRole = roles.map((role)=>role.toLocaleLowerCase()).some((role)=>role === 'admin' || role === 'owner' || role === 'moderator');
        if (hasRole) {
          throw new Error('Invalid role assigned to the user. Should not be admin, owner or moderator.');
        }
      }
      if (!data.type) {
        data.type = UserType.BOT;
      }
    }
    return new UserBuilder(data);
  }
  finish(builder) {
    switch(builder.kind){
      case RocketChatAssociationModel.MESSAGE:
        return this._finishMessage(builder);
      case RocketChatAssociationModel.LIVECHAT_MESSAGE:
        return this._finishLivechatMessage(builder);
      case RocketChatAssociationModel.ROOM:
        return this._finishRoom(builder);
      case RocketChatAssociationModel.DISCUSSION:
        return this._finishDiscussion(builder);
      case RocketChatAssociationModel.VIDEO_CONFERENCE:
        return this._finishVideoConference(builder);
      case RocketChatAssociationModel.USER:
        return this._finishUser(builder);
      default:
        throw new Error('Invalid builder passed to the ModifyCreator.finish function.');
    }
  }
  async _finishMessage(builder) {
    const result = builder.getMessage();
    delete result.id;
    if (!result.sender || !result.sender.id) {
      const response = await this.senderFn({
        method: 'bridges:getUserBridge:doGetAppUser',
        params: [
          'APP_ID'
        ]
      }).catch((err)=>{
        throw formatErrorResponse(err);
      });
      const appUser = response.result;
      if (!appUser) {
        throw new Error('Invalid sender assigned to the message.');
      }
      result.sender = appUser;
    }
    if (result.blocks?.length) {
      // Can we move this elsewhere? This AppObjectRegistry usage doesn't really belong here, but where?
      result.blocks = UIHelper.assignIds(result.blocks, AppObjectRegistry.get('id') || '');
    }
    const response = await this.senderFn({
      method: 'bridges:getMessageBridge:doCreate',
      params: [
        result,
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    return String(response.result);
  }
  async _finishLivechatMessage(builder) {
    if (builder.getSender() && !builder.getVisitor()) {
      return this._finishMessage(builder.getMessageBuilder());
    }
    const result = builder.getMessage();
    delete result.id;
    if (!result.token && (!result.visitor || !result.visitor.token)) {
      throw new Error('Invalid visitor sending the message');
    }
    result.token = result.visitor ? result.visitor.token : result.token;
    const response = await this.senderFn({
      method: 'bridges:getLivechatBridge:doCreateMessage',
      params: [
        result,
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    return String(response.result);
  }
  async _finishRoom(builder) {
    const result = builder.getRoom();
    delete result.id;
    if (!result.type) {
      throw new Error('Invalid type assigned to the room.');
    }
    if (result.type !== RoomType.LIVE_CHAT) {
      if (!result.creator || !result.creator.id) {
        throw new Error('Invalid creator assigned to the room.');
      }
    }
    if (result.type !== RoomType.DIRECT_MESSAGE) {
      if (result.type !== RoomType.LIVE_CHAT) {
        if (!result.slugifiedName || !result.slugifiedName.trim()) {
          throw new Error('Invalid slugifiedName assigned to the room.');
        }
      }
      if (!result.displayName || !result.displayName.trim()) {
        throw new Error('Invalid displayName assigned to the room.');
      }
    }
    const response = await this.senderFn({
      method: 'bridges:getRoomBridge:doCreate',
      params: [
        result,
        builder.getMembersToBeAddedUsernames(),
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    return String(response.result);
  }
  async _finishDiscussion(builder) {
    const room = builder.getRoom();
    delete room.id;
    if (!room.creator || !room.creator.id) {
      throw new Error('Invalid creator assigned to the discussion.');
    }
    if (!room.slugifiedName || !room.slugifiedName.trim()) {
      throw new Error('Invalid slugifiedName assigned to the discussion.');
    }
    if (!room.displayName || !room.displayName.trim()) {
      throw new Error('Invalid displayName assigned to the discussion.');
    }
    if (!room.parentRoom || !room.parentRoom.id) {
      throw new Error('Invalid parentRoom assigned to the discussion.');
    }
    const response = await this.senderFn({
      method: 'bridges:getRoomBridge:doCreateDiscussion',
      params: [
        room,
        builder.getParentMessage(),
        builder.getReply(),
        builder.getMembersToBeAddedUsernames(),
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    return String(response.result);
  }
  async _finishVideoConference(builder) {
    const videoConference = builder.getVideoConference();
    if (!videoConference.createdBy) {
      throw new Error('Invalid creator assigned to the video conference.');
    }
    if (!videoConference.providerName?.trim()) {
      throw new Error('Invalid provider name assigned to the video conference.');
    }
    if (!videoConference.rid) {
      throw new Error('Invalid roomId assigned to the video conference.');
    }
    const response = await this.senderFn({
      method: 'bridges:getVideoConferenceBridge:doCreate',
      params: [
        videoConference,
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    return String(response.result);
  }
  async _finishUser(builder) {
    const user = builder.getUser();
    const response = await this.senderFn({
      method: 'bridges:getUserBridge:doCreate',
      params: [
        user,
        AppObjectRegistry.get('id')
      ]
    }).catch((err)=>{
      throw formatErrorResponse(err);
    });
    return String(response.result);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdmFyL2ZvbGRlcnMvcHQvNnBqM3hjMzk3ZzkxZF9qa3F6eDdtbmp3MDAwMGduL1QvYXBwcy1lbmdpbmUtdGVtcC9kZW5vLXJ1bnRpbWUvbGliL2FjY2Vzc29ycy9tb2RpZnkvTW9kaWZ5Q3JlYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElNb2RpZnlDcmVhdG9yIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lNb2RpZnlDcmVhdG9yLnRzJztcbmltcG9ydCB0eXBlIHsgSVVwbG9hZENyZWF0b3IgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSVVwbG9hZENyZWF0b3IudHMnO1xuaW1wb3J0IHR5cGUgeyBJRW1haWxDcmVhdG9yIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lFbWFpbENyZWF0b3IudHMnO1xuaW1wb3J0IHR5cGUgeyBJQ29udGFjdENyZWF0b3IgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSUNvbnRhY3RDcmVhdG9yLnRzJztcbmltcG9ydCB0eXBlIHsgSUxpdmVjaGF0Q3JlYXRvciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JTGl2ZWNoYXRDcmVhdG9yLnRzJztcbmltcG9ydCB0eXBlIHsgSU1lc3NhZ2UgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9tZXNzYWdlcy9JTWVzc2FnZS50cyc7XG5pbXBvcnQgdHlwZSB7IElSb29tIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vcm9vbXMvSVJvb20udHMnO1xuaW1wb3J0IHR5cGUgeyBJQm90VXNlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3VzZXJzL0lCb3RVc2VyLnRzJztcbmltcG9ydCB0eXBlIHsgVXNlclR5cGUgYXMgX1VzZXJUeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vdXNlcnMvVXNlclR5cGUudHMnO1xuaW1wb3J0IHR5cGUgeyBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbCBhcyBfUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9tZXRhZGF0YS9Sb2NrZXRDaGF0QXNzb2NpYXRpb25zLnRzJztcbmltcG9ydCB0eXBlIHsgSU1lc3NhZ2VCdWlsZGVyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lNZXNzYWdlQnVpbGRlci50cyc7XG5pbXBvcnQgdHlwZSB7IElSb29tQnVpbGRlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JUm9vbUJ1aWxkZXIudHMnO1xuaW1wb3J0IHR5cGUgeyBJVXNlckJ1aWxkZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSVVzZXJCdWlsZGVyLnRzJztcbmltcG9ydCB0eXBlIHsgSVZpZGVvQ29uZmVyZW5jZUJ1aWxkZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSVZpZGVvQ29uZmVyZW5jZUJ1aWxkZXIudHMnO1xuaW1wb3J0IHR5cGUgeyBSb29tVHlwZSBhcyBfUm9vbVR5cGUgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9yb29tcy9Sb29tVHlwZS50cyc7XG5pbXBvcnQgdHlwZSB7IElMaXZlY2hhdE1lc3NhZ2VCdWlsZGVyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lMaXZlY2hhdE1lc3NhZ2VCdWlsZGVyLnRzJztcbmltcG9ydCB0eXBlIHsgVUlIZWxwZXIgYXMgX1VJSGVscGVyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9taXNjL1VJSGVscGVyLnRzJztcblxuaW1wb3J0ICogYXMgTWVzc2VuZ2VyIGZyb20gJy4uLy4uL21lc3Nlbmdlci50cyc7XG5pbXBvcnQgeyByYW5kb21CeXRlcyB9IGZyb20gJ25vZGU6Y3J5cHRvJztcblxuaW1wb3J0IHsgQmxvY2tCdWlsZGVyIH0gZnJvbSAnLi4vYnVpbGRlcnMvQmxvY2tCdWlsZGVyLnRzJztcbmltcG9ydCB7IE1lc3NhZ2VCdWlsZGVyIH0gZnJvbSAnLi4vYnVpbGRlcnMvTWVzc2FnZUJ1aWxkZXIudHMnO1xuaW1wb3J0IHsgRGlzY3Vzc2lvbkJ1aWxkZXIsIElEaXNjdXNzaW9uQnVpbGRlciB9IGZyb20gJy4uL2J1aWxkZXJzL0Rpc2N1c3Npb25CdWlsZGVyLnRzJztcbmltcG9ydCB7IElMaXZlY2hhdE1lc3NhZ2UsIExpdmVjaGF0TWVzc2FnZUJ1aWxkZXIgfSBmcm9tICcuLi9idWlsZGVycy9MaXZlY2hhdE1lc3NhZ2VCdWlsZGVyLnRzJztcbmltcG9ydCB7IFJvb21CdWlsZGVyIH0gZnJvbSAnLi4vYnVpbGRlcnMvUm9vbUJ1aWxkZXIudHMnO1xuaW1wb3J0IHsgVXNlckJ1aWxkZXIgfSBmcm9tICcuLi9idWlsZGVycy9Vc2VyQnVpbGRlci50cyc7XG5pbXBvcnQgeyBBcHBWaWRlb0NvbmZlcmVuY2UsIFZpZGVvQ29uZmVyZW5jZUJ1aWxkZXIgfSBmcm9tICcuLi9idWlsZGVycy9WaWRlb0NvbmZlcmVuY2VCdWlsZGVyLnRzJztcbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xuaW1wb3J0IHsgcmVxdWlyZSB9IGZyb20gJy4uLy4uLy4uL2xpYi9yZXF1aXJlLnRzJztcbmltcG9ydCB7IGZvcm1hdEVycm9yUmVzcG9uc2UgfSBmcm9tICcuLi9mb3JtYXRSZXNwb25zZUVycm9ySGFuZGxlci50cyc7XG5cbmNvbnN0IHsgVUlIZWxwZXIgfSA9IHJlcXVpcmUoJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvbWlzYy9VSUhlbHBlci5qcycpIGFzIHsgVUlIZWxwZXI6IHR5cGVvZiBfVUlIZWxwZXIgfTtcbmNvbnN0IHsgUm9vbVR5cGUgfSA9IHJlcXVpcmUoJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3Jvb21zL1Jvb21UeXBlLmpzJykgYXMgeyBSb29tVHlwZTogdHlwZW9mIF9Sb29tVHlwZSB9O1xuY29uc3QgeyBVc2VyVHlwZSB9ID0gcmVxdWlyZSgnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vdXNlcnMvVXNlclR5cGUuanMnKSBhcyB7IFVzZXJUeXBlOiB0eXBlb2YgX1VzZXJUeXBlIH07XG5jb25zdCB7IFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsIH0gPSByZXF1aXJlKCdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9tZXRhZGF0YS9Sb2NrZXRDaGF0QXNzb2NpYXRpb25zLmpzJykgYXMge1xuXHRSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbDogdHlwZW9mIF9Sb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbDtcbn07XG5cbmV4cG9ydCBjbGFzcyBNb2RpZnlDcmVhdG9yIGltcGxlbWVudHMgSU1vZGlmeUNyZWF0b3Ige1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNlbmRlckZuOiB0eXBlb2YgTWVzc2VuZ2VyLnNlbmRSZXF1ZXN0KSB7fVxuXG5cdGdldExpdmVjaGF0Q3JlYXRvcigpOiBJTGl2ZWNoYXRDcmVhdG9yIHtcblx0XHRyZXR1cm4gbmV3IFByb3h5KFxuXHRcdFx0eyBfX2tpbmQ6ICdnZXRMaXZlY2hhdENyZWF0b3InIH0sXG5cdFx0XHR7XG5cdFx0XHRcdGdldDogKF90YXJnZXQ6IHVua25vd24sIHByb3A6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdC8vIEl0J3Mgbm90IHdvcnRod2hpbGUgdG8gbWFrZSBhbiBhc3luY2hyb25vdXMgcmVxdWVzdCBmb3Igc3VjaCBhIHNpbXBsZSBtZXRob2Rcblx0XHRcdFx0XHRpZiAocHJvcCA9PT0gJ2NyZWF0ZVRva2VuJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuICgpID0+IHJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnaGV4Jyk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHByb3AgPT09ICd0b0pTT04nKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gKCkgPT4gKHt9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gKC4uLnBhcmFtczogdW5rbm93bltdKSA9PlxuXHRcdFx0XHRcdFx0dGhpcy5zZW5kZXJGbih7XG5cdFx0XHRcdFx0XHRcdG1ldGhvZDogYGFjY2Vzc29yOmdldE1vZGlmaWVyOmdldENyZWF0b3I6Z2V0TGl2ZWNoYXRDcmVhdG9yOiR7cHJvcH1gLFxuXHRcdFx0XHRcdFx0XHRwYXJhbXMsXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLnJlc3VsdClcblx0XHRcdFx0XHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHQpIGFzIElMaXZlY2hhdENyZWF0b3I7XG5cdH1cblxuXHRnZXRVcGxvYWRDcmVhdG9yKCk6IElVcGxvYWRDcmVhdG9yIHtcblx0XHRyZXR1cm4gbmV3IFByb3h5KFxuXHRcdFx0eyBfX2tpbmQ6ICdnZXRVcGxvYWRDcmVhdG9yJyB9LFxuXHRcdFx0e1xuXHRcdFx0XHRnZXQ6XG5cdFx0XHRcdFx0KF90YXJnZXQ6IHVua25vd24sIHByb3A6IHN0cmluZykgPT5cblx0XHRcdFx0XHQoLi4ucGFyYW1zOiB1bmtub3duW10pID0+XG5cdFx0XHRcdFx0XHRwcm9wID09PSAndG9KU09OJ1xuXHRcdFx0XHRcdFx0XHQ/IHt9XG5cdFx0XHRcdFx0XHRcdDogdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRcdFx0XHRcdFx0XHRtZXRob2Q6IGBhY2Nlc3NvcjpnZXRNb2RpZmllcjpnZXRDcmVhdG9yOmdldFVwbG9hZENyZWF0b3I6JHtwcm9wfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXJhbXMsXG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKChyZXNwb25zZSkgPT4gcmVzcG9uc2UucmVzdWx0KVxuXHRcdFx0XHRcdFx0XHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHR9LFxuXHRcdCkgYXMgSVVwbG9hZENyZWF0b3I7XG5cdH1cblxuXHRnZXRFbWFpbENyZWF0b3IoKTogSUVtYWlsQ3JlYXRvciB7XG5cdFx0cmV0dXJuIG5ldyBQcm94eShcblx0XHRcdHsgX19raW5kOiAnZ2V0RW1haWxDcmVhdG9yJyB9LFxuXHRcdFx0e1xuXHRcdFx0XHRnZXQ6XG5cdFx0XHRcdFx0KF90YXJnZXQ6IHVua25vd24sIHByb3A6IHN0cmluZykgPT5cblx0XHRcdFx0XHQoLi4ucGFyYW1zOiB1bmtub3duW10pID0+XG5cdFx0XHRcdFx0XHRwcm9wID09PSAndG9KU09OJ1xuXHRcdFx0XHRcdFx0XHQ/IHt9XG5cdFx0XHRcdFx0XHRcdDogdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRcdFx0XHRcdFx0XHRtZXRob2Q6IGBhY2Nlc3NvcjpnZXRNb2RpZmllcjpnZXRDcmVhdG9yOmdldEVtYWlsQ3JlYXRvcjoke3Byb3B9YCxcblx0XHRcdFx0XHRcdFx0XHRcdHBhcmFtcyxcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5yZXN1bHQpXG5cdFx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdH0sXG5cdFx0KTtcblx0fVxuXG5cdGdldENvbnRhY3RDcmVhdG9yKCk6IElDb250YWN0Q3JlYXRvciB7XG5cdFx0cmV0dXJuIG5ldyBQcm94eShcblx0XHRcdHsgX19raW5kOiAnZ2V0Q29udGFjdENyZWF0b3InIH0sXG5cdFx0XHR7XG5cdFx0XHRcdGdldDpcblx0XHRcdFx0XHQoX3RhcmdldDogdW5rbm93biwgcHJvcDogc3RyaW5nKSA9PlxuXHRcdFx0XHRcdCguLi5wYXJhbXM6IHVua25vd25bXSkgPT5cblx0XHRcdFx0XHRcdHByb3AgPT09ICd0b0pTT04nXG5cdFx0XHRcdFx0XHRcdD8ge31cblx0XHRcdFx0XHRcdFx0OiB0aGlzLnNlbmRlckZuKHtcblx0XHRcdFx0XHRcdFx0XHRcdG1ldGhvZDogYGFjY2Vzc29yOmdldE1vZGlmaWVyOmdldENyZWF0b3I6Z2V0Q29udGFjdENyZWF0b3I6JHtwcm9wfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXJhbXMsXG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKChyZXNwb25zZSkgPT4gcmVzcG9uc2UucmVzdWx0KVxuXHRcdFx0XHRcdFx0XHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHR9LFxuXHRcdCk7XG5cdH1cblxuXHRnZXRCbG9ja0J1aWxkZXIoKSB7XG5cdFx0cmV0dXJuIG5ldyBCbG9ja0J1aWxkZXIoKTtcblx0fVxuXG5cdHN0YXJ0TWVzc2FnZShkYXRhPzogSU1lc3NhZ2UpIHtcblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0ZGVsZXRlIGRhdGEuaWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBNZXNzYWdlQnVpbGRlcihkYXRhKTtcblx0fVxuXG5cdHN0YXJ0TGl2ZWNoYXRNZXNzYWdlKGRhdGE/OiBJTGl2ZWNoYXRNZXNzYWdlKSB7XG5cdFx0aWYgKGRhdGEpIHtcblx0XHRcdGRlbGV0ZSBkYXRhLmlkO1xuXHRcdH1cblxuXHRcdHJldHVybiBuZXcgTGl2ZWNoYXRNZXNzYWdlQnVpbGRlcihkYXRhKTtcblx0fVxuXG5cdHN0YXJ0Um9vbShkYXRhPzogSVJvb20pIHtcblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZSAtIHRoaXMgaGFzIGJlZW4gaW1wb3J0ZWQgZnJvbSB0aGUgQXBwcy1FbmdpbmVcblx0XHRcdGRlbGV0ZSBkYXRhLmlkO1xuXHRcdH1cblxuXHRcdHJldHVybiBuZXcgUm9vbUJ1aWxkZXIoZGF0YSk7XG5cdH1cblxuXHRzdGFydERpc2N1c3Npb24oZGF0YT86IFBhcnRpYWw8SVJvb20+KSB7XG5cdFx0aWYgKGRhdGEpIHtcblx0XHRcdGRlbGV0ZSBkYXRhLmlkO1xuXHRcdH1cblxuXHRcdHJldHVybiBuZXcgRGlzY3Vzc2lvbkJ1aWxkZXIoZGF0YSk7XG5cdH1cblxuXHRzdGFydFZpZGVvQ29uZmVyZW5jZShkYXRhPzogUGFydGlhbDxBcHBWaWRlb0NvbmZlcmVuY2U+KSB7XG5cdFx0cmV0dXJuIG5ldyBWaWRlb0NvbmZlcmVuY2VCdWlsZGVyKGRhdGEpO1xuXHR9XG5cblx0c3RhcnRCb3RVc2VyKGRhdGE/OiBQYXJ0aWFsPElCb3RVc2VyPikge1xuXHRcdGlmIChkYXRhKSB7XG5cdFx0XHRkZWxldGUgZGF0YS5pZDtcblxuXHRcdFx0Y29uc3QgeyByb2xlcyB9ID0gZGF0YTtcblxuXHRcdFx0aWYgKHJvbGVzPy5sZW5ndGgpIHtcblx0XHRcdFx0Y29uc3QgaGFzUm9sZSA9IHJvbGVzXG5cdFx0XHRcdFx0Lm1hcCgocm9sZTogc3RyaW5nKSA9PiByb2xlLnRvTG9jYWxlTG93ZXJDYXNlKCkpXG5cdFx0XHRcdFx0LnNvbWUoKHJvbGU6IHN0cmluZykgPT4gcm9sZSA9PT0gJ2FkbWluJyB8fCByb2xlID09PSAnb3duZXInIHx8IHJvbGUgPT09ICdtb2RlcmF0b3InKTtcblxuXHRcdFx0XHRpZiAoaGFzUm9sZSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCByb2xlIGFzc2lnbmVkIHRvIHRoZSB1c2VyLiBTaG91bGQgbm90IGJlIGFkbWluLCBvd25lciBvciBtb2RlcmF0b3IuJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCFkYXRhLnR5cGUpIHtcblx0XHRcdFx0ZGF0YS50eXBlID0gVXNlclR5cGUuQk9UO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBuZXcgVXNlckJ1aWxkZXIoZGF0YSk7XG5cdH1cblxuXHRwdWJsaWMgZmluaXNoKFxuXHRcdGJ1aWxkZXI6IElNZXNzYWdlQnVpbGRlciB8IElMaXZlY2hhdE1lc3NhZ2VCdWlsZGVyIHwgSVJvb21CdWlsZGVyIHwgSURpc2N1c3Npb25CdWlsZGVyIHwgSVZpZGVvQ29uZmVyZW5jZUJ1aWxkZXIgfCBJVXNlckJ1aWxkZXIsXG5cdCk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0c3dpdGNoIChidWlsZGVyLmtpbmQpIHtcblx0XHRcdGNhc2UgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwuTUVTU0FHRTpcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2ZpbmlzaE1lc3NhZ2UoYnVpbGRlciBhcyBJTWVzc2FnZUJ1aWxkZXIpO1xuXHRcdFx0Y2FzZSBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbC5MSVZFQ0hBVF9NRVNTQUdFOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fZmluaXNoTGl2ZWNoYXRNZXNzYWdlKGJ1aWxkZXIgYXMgSUxpdmVjaGF0TWVzc2FnZUJ1aWxkZXIpO1xuXHRcdFx0Y2FzZSBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbC5ST09NOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fZmluaXNoUm9vbShidWlsZGVyIGFzIElSb29tQnVpbGRlcik7XG5cdFx0XHRjYXNlIFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsLkRJU0NVU1NJT046XG5cdFx0XHRcdHJldHVybiB0aGlzLl9maW5pc2hEaXNjdXNzaW9uKGJ1aWxkZXIgYXMgSURpc2N1c3Npb25CdWlsZGVyKTtcblx0XHRcdGNhc2UgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwuVklERU9fQ09ORkVSRU5DRTpcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2ZpbmlzaFZpZGVvQ29uZmVyZW5jZShidWlsZGVyIGFzIElWaWRlb0NvbmZlcmVuY2VCdWlsZGVyKTtcblx0XHRcdGNhc2UgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwuVVNFUjpcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2ZpbmlzaFVzZXIoYnVpbGRlciBhcyBJVXNlckJ1aWxkZXIpO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJ1aWxkZXIgcGFzc2VkIHRvIHRoZSBNb2RpZnlDcmVhdG9yLmZpbmlzaCBmdW5jdGlvbi4nKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIF9maW5pc2hNZXNzYWdlKGJ1aWxkZXI6IElNZXNzYWdlQnVpbGRlcik6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gYnVpbGRlci5nZXRNZXNzYWdlKCk7XG5cdFx0ZGVsZXRlIHJlc3VsdC5pZDtcblxuXHRcdGlmICghcmVzdWx0LnNlbmRlciB8fCAhcmVzdWx0LnNlbmRlci5pZCkge1xuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnNlbmRlckZuKHtcblx0XHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRVc2VyQnJpZGdlOmRvR2V0QXBwVXNlcicsXG5cdFx0XHRcdHBhcmFtczogWydBUFBfSUQnXSxcblx0XHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGFwcFVzZXIgPSByZXNwb25zZS5yZXN1bHQ7XG5cblx0XHRcdGlmICghYXBwVXNlcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc2VuZGVyIGFzc2lnbmVkIHRvIHRoZSBtZXNzYWdlLicpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXN1bHQuc2VuZGVyID0gYXBwVXNlcjtcblx0XHR9XG5cblx0XHRpZiAocmVzdWx0LmJsb2Nrcz8ubGVuZ3RoKSB7XG5cdFx0XHQvLyBDYW4gd2UgbW92ZSB0aGlzIGVsc2V3aGVyZT8gVGhpcyBBcHBPYmplY3RSZWdpc3RyeSB1c2FnZSBkb2Vzbid0IHJlYWxseSBiZWxvbmcgaGVyZSwgYnV0IHdoZXJlP1xuXHRcdFx0cmVzdWx0LmJsb2NrcyA9IFVJSGVscGVyLmFzc2lnbklkcyhyZXN1bHQuYmxvY2tzLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJykgfHwgJycpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRtZXRob2Q6ICdicmlkZ2VzOmdldE1lc3NhZ2VCcmlkZ2U6ZG9DcmVhdGUnLFxuXHRcdFx0cGFyYW1zOiBbcmVzdWx0LCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBTdHJpbmcocmVzcG9uc2UucmVzdWx0KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgX2ZpbmlzaExpdmVjaGF0TWVzc2FnZShidWlsZGVyOiBJTGl2ZWNoYXRNZXNzYWdlQnVpbGRlcik6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0aWYgKGJ1aWxkZXIuZ2V0U2VuZGVyKCkgJiYgIWJ1aWxkZXIuZ2V0VmlzaXRvcigpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fZmluaXNoTWVzc2FnZShidWlsZGVyLmdldE1lc3NhZ2VCdWlsZGVyKCkpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJlc3VsdCA9IGJ1aWxkZXIuZ2V0TWVzc2FnZSgpO1xuXHRcdGRlbGV0ZSByZXN1bHQuaWQ7XG5cblx0XHRpZiAoIXJlc3VsdC50b2tlbiAmJiAoIXJlc3VsdC52aXNpdG9yIHx8ICFyZXN1bHQudmlzaXRvci50b2tlbikpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2aXNpdG9yIHNlbmRpbmcgdGhlIG1lc3NhZ2UnKTtcblx0XHR9XG5cblx0XHRyZXN1bHQudG9rZW4gPSByZXN1bHQudmlzaXRvciA/IHJlc3VsdC52aXNpdG9yLnRva2VuIDogcmVzdWx0LnRva2VuO1xuXG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnNlbmRlckZuKHtcblx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0TGl2ZWNoYXRCcmlkZ2U6ZG9DcmVhdGVNZXNzYWdlJyxcblx0XHRcdHBhcmFtczogW3Jlc3VsdCwgQXBwT2JqZWN0UmVnaXN0cnkuZ2V0KCdpZCcpXSxcblx0XHR9KS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gU3RyaW5nKHJlc3BvbnNlLnJlc3VsdCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIF9maW5pc2hSb29tKGJ1aWxkZXI6IElSb29tQnVpbGRlcik6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gYnVpbGRlci5nZXRSb29tKCk7XG5cdFx0ZGVsZXRlIHJlc3VsdC5pZDtcblxuXHRcdGlmICghcmVzdWx0LnR5cGUpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0eXBlIGFzc2lnbmVkIHRvIHRoZSByb29tLicpO1xuXHRcdH1cblxuXHRcdGlmIChyZXN1bHQudHlwZSAhPT0gUm9vbVR5cGUuTElWRV9DSEFUKSB7XG5cdFx0XHRpZiAoIXJlc3VsdC5jcmVhdG9yIHx8ICFyZXN1bHQuY3JlYXRvci5pZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY3JlYXRvciBhc3NpZ25lZCB0byB0aGUgcm9vbS4nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAocmVzdWx0LnR5cGUgIT09IFJvb21UeXBlLkRJUkVDVF9NRVNTQUdFKSB7XG5cdFx0XHRpZiAocmVzdWx0LnR5cGUgIT09IFJvb21UeXBlLkxJVkVfQ0hBVCkge1xuXHRcdFx0XHRpZiAoIXJlc3VsdC5zbHVnaWZpZWROYW1lIHx8ICFyZXN1bHQuc2x1Z2lmaWVkTmFtZS50cmltKCkpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc2x1Z2lmaWVkTmFtZSBhc3NpZ25lZCB0byB0aGUgcm9vbS4nKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXJlc3VsdC5kaXNwbGF5TmFtZSB8fCAhcmVzdWx0LmRpc3BsYXlOYW1lLnRyaW0oKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlzcGxheU5hbWUgYXNzaWduZWQgdG8gdGhlIHJvb20uJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnNlbmRlckZuKHtcblx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0Um9vbUJyaWRnZTpkb0NyZWF0ZScsXG5cdFx0XHRwYXJhbXM6IFtyZXN1bHQsIGJ1aWxkZXIuZ2V0TWVtYmVyc1RvQmVBZGRlZFVzZXJuYW1lcygpLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBTdHJpbmcocmVzcG9uc2UucmVzdWx0KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgX2ZpbmlzaERpc2N1c3Npb24oYnVpbGRlcjogSURpc2N1c3Npb25CdWlsZGVyKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCByb29tID0gYnVpbGRlci5nZXRSb29tKCk7XG5cdFx0ZGVsZXRlIHJvb20uaWQ7XG5cblx0XHRpZiAoIXJvb20uY3JlYXRvciB8fCAhcm9vbS5jcmVhdG9yLmlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY3JlYXRvciBhc3NpZ25lZCB0byB0aGUgZGlzY3Vzc2lvbi4nKTtcblx0XHR9XG5cblx0XHRpZiAoIXJvb20uc2x1Z2lmaWVkTmFtZSB8fCAhcm9vbS5zbHVnaWZpZWROYW1lLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHNsdWdpZmllZE5hbWUgYXNzaWduZWQgdG8gdGhlIGRpc2N1c3Npb24uJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tLmRpc3BsYXlOYW1lIHx8ICFyb29tLmRpc3BsYXlOYW1lLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRpc3BsYXlOYW1lIGFzc2lnbmVkIHRvIHRoZSBkaXNjdXNzaW9uLicpO1xuXHRcdH1cblxuXHRcdGlmICghcm9vbS5wYXJlbnRSb29tIHx8ICFyb29tLnBhcmVudFJvb20uaWQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXJlbnRSb29tIGFzc2lnbmVkIHRvIHRoZSBkaXNjdXNzaW9uLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRtZXRob2Q6ICdicmlkZ2VzOmdldFJvb21CcmlkZ2U6ZG9DcmVhdGVEaXNjdXNzaW9uJyxcblx0XHRcdHBhcmFtczogW3Jvb20sIGJ1aWxkZXIuZ2V0UGFyZW50TWVzc2FnZSgpLCBidWlsZGVyLmdldFJlcGx5KCksIGJ1aWxkZXIuZ2V0TWVtYmVyc1RvQmVBZGRlZFVzZXJuYW1lcygpLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBTdHJpbmcocmVzcG9uc2UucmVzdWx0KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgX2ZpbmlzaFZpZGVvQ29uZmVyZW5jZShidWlsZGVyOiBJVmlkZW9Db25mZXJlbmNlQnVpbGRlcik6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgdmlkZW9Db25mZXJlbmNlID0gYnVpbGRlci5nZXRWaWRlb0NvbmZlcmVuY2UoKTtcblxuXHRcdGlmICghdmlkZW9Db25mZXJlbmNlLmNyZWF0ZWRCeSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNyZWF0b3IgYXNzaWduZWQgdG8gdGhlIHZpZGVvIGNvbmZlcmVuY2UuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF2aWRlb0NvbmZlcmVuY2UucHJvdmlkZXJOYW1lPy50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwcm92aWRlciBuYW1lIGFzc2lnbmVkIHRvIHRoZSB2aWRlbyBjb25mZXJlbmNlLicpO1xuXHRcdH1cblxuXHRcdGlmICghdmlkZW9Db25mZXJlbmNlLnJpZCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHJvb21JZCBhc3NpZ25lZCB0byB0aGUgdmlkZW8gY29uZmVyZW5jZS4nKTtcblx0XHR9XG5cblx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRWaWRlb0NvbmZlcmVuY2VCcmlkZ2U6ZG9DcmVhdGUnLFxuXHRcdFx0cGFyYW1zOiBbdmlkZW9Db25mZXJlbmNlLCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBTdHJpbmcocmVzcG9uc2UucmVzdWx0KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgX2ZpbmlzaFVzZXIoYnVpbGRlcjogSVVzZXJCdWlsZGVyKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCB1c2VyID0gYnVpbGRlci5nZXRVc2VyKCk7XG5cblx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRVc2VyQnJpZGdlOmRvQ3JlYXRlJyxcblx0XHRcdHBhcmFtczogW3VzZXIsIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFN0cmluZyhyZXNwb25zZS5yZXN1bHQpO1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBbUJBLFNBQVMsV0FBVyxRQUFRLGNBQWM7QUFFMUMsU0FBUyxZQUFZLFFBQVEsOEJBQThCO0FBQzNELFNBQVMsY0FBYyxRQUFRLGdDQUFnQztBQUMvRCxTQUFTLGlCQUFpQixRQUE0QixtQ0FBbUM7QUFDekYsU0FBMkIsc0JBQXNCLFFBQVEsd0NBQXdDO0FBQ2pHLFNBQVMsV0FBVyxRQUFRLDZCQUE2QjtBQUN6RCxTQUFTLFdBQVcsUUFBUSw2QkFBNkI7QUFDekQsU0FBNkIsc0JBQXNCLFFBQVEsd0NBQXdDO0FBQ25HLFNBQVMsaUJBQWlCLFFBQVEsZ0NBQWdDO0FBQ2xFLFNBQVMsT0FBTyxRQUFRLDBCQUEwQjtBQUNsRCxTQUFTLG1CQUFtQixRQUFRLG1DQUFtQztBQUV2RSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsUUFBUTtBQUM3QixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsUUFBUTtBQUM3QixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcs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
// denoCacheMetadata=5760892385139692104,16465340940589512571