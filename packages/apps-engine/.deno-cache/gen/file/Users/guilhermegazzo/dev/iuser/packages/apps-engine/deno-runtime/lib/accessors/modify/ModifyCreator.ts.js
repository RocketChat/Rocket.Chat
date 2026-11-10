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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L2l1c2VyL3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9saWIvYWNjZXNzb3JzL21vZGlmeS9Nb2RpZnlDcmVhdG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSU1vZGlmeUNyZWF0b3IgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSU1vZGlmeUNyZWF0b3IudHMnO1xuaW1wb3J0IHR5cGUgeyBJVXBsb2FkQ3JlYXRvciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JVXBsb2FkQ3JlYXRvci50cyc7XG5pbXBvcnQgdHlwZSB7IElFbWFpbENyZWF0b3IgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSUVtYWlsQ3JlYXRvci50cyc7XG5pbXBvcnQgdHlwZSB7IElDb250YWN0Q3JlYXRvciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JQ29udGFjdENyZWF0b3IudHMnO1xuaW1wb3J0IHR5cGUgeyBJTGl2ZWNoYXRDcmVhdG9yIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lMaXZlY2hhdENyZWF0b3IudHMnO1xuaW1wb3J0IHR5cGUgeyBJTWVzc2FnZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL21lc3NhZ2VzL0lNZXNzYWdlLnRzJztcbmltcG9ydCB0eXBlIHsgSVJvb20gfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9yb29tcy9JUm9vbS50cyc7XG5pbXBvcnQgdHlwZSB7IElCb3RVc2VyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vdXNlcnMvSUJvdFVzZXIudHMnO1xuaW1wb3J0IHR5cGUgeyBVc2VyVHlwZSBhcyBfVXNlclR5cGUgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi91c2Vycy9Vc2VyVHlwZS50cyc7XG5pbXBvcnQgdHlwZSB7IFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsIGFzIF9Sb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL21ldGFkYXRhL1JvY2tldENoYXRBc3NvY2lhdGlvbnMudHMnO1xuaW1wb3J0IHR5cGUgeyBJTWVzc2FnZUJ1aWxkZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSU1lc3NhZ2VCdWlsZGVyLnRzJztcbmltcG9ydCB0eXBlIHsgSVJvb21CdWlsZGVyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lSb29tQnVpbGRlci50cyc7XG5pbXBvcnQgdHlwZSB7IElVc2VyQnVpbGRlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JVXNlckJ1aWxkZXIudHMnO1xuaW1wb3J0IHR5cGUgeyBJVmlkZW9Db25mZXJlbmNlQnVpbGRlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JVmlkZW9Db25mZXJlbmNlQnVpbGRlci50cyc7XG5pbXBvcnQgdHlwZSB7IFJvb21UeXBlIGFzIF9Sb29tVHlwZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3Jvb21zL1Jvb21UeXBlLnRzJztcbmltcG9ydCB0eXBlIHsgSUxpdmVjaGF0TWVzc2FnZUJ1aWxkZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSUxpdmVjaGF0TWVzc2FnZUJ1aWxkZXIudHMnO1xuaW1wb3J0IHR5cGUgeyBVSUhlbHBlciBhcyBfVUlIZWxwZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL21pc2MvVUlIZWxwZXIudHMnO1xuXG5pbXBvcnQgKiBhcyBNZXNzZW5nZXIgZnJvbSAnLi4vLi4vbWVzc2VuZ2VyLnRzJztcbmltcG9ydCB7IHJhbmRvbUJ5dGVzIH0gZnJvbSAnbm9kZTpjcnlwdG8nO1xuXG5pbXBvcnQgeyBCbG9ja0J1aWxkZXIgfSBmcm9tICcuLi9idWlsZGVycy9CbG9ja0J1aWxkZXIudHMnO1xuaW1wb3J0IHsgTWVzc2FnZUJ1aWxkZXIgfSBmcm9tICcuLi9idWlsZGVycy9NZXNzYWdlQnVpbGRlci50cyc7XG5pbXBvcnQgeyBEaXNjdXNzaW9uQnVpbGRlciwgSURpc2N1c3Npb25CdWlsZGVyIH0gZnJvbSAnLi4vYnVpbGRlcnMvRGlzY3Vzc2lvbkJ1aWxkZXIudHMnO1xuaW1wb3J0IHsgSUxpdmVjaGF0TWVzc2FnZSwgTGl2ZWNoYXRNZXNzYWdlQnVpbGRlciB9IGZyb20gJy4uL2J1aWxkZXJzL0xpdmVjaGF0TWVzc2FnZUJ1aWxkZXIudHMnO1xuaW1wb3J0IHsgUm9vbUJ1aWxkZXIgfSBmcm9tICcuLi9idWlsZGVycy9Sb29tQnVpbGRlci50cyc7XG5pbXBvcnQgeyBVc2VyQnVpbGRlciB9IGZyb20gJy4uL2J1aWxkZXJzL1VzZXJCdWlsZGVyLnRzJztcbmltcG9ydCB7IEFwcFZpZGVvQ29uZmVyZW5jZSwgVmlkZW9Db25mZXJlbmNlQnVpbGRlciB9IGZyb20gJy4uL2J1aWxkZXJzL1ZpZGVvQ29uZmVyZW5jZUJ1aWxkZXIudHMnO1xuaW1wb3J0IHsgQXBwT2JqZWN0UmVnaXN0cnkgfSBmcm9tICcuLi8uLi8uLi9BcHBPYmplY3RSZWdpc3RyeS50cyc7XG5pbXBvcnQgeyByZXF1aXJlIH0gZnJvbSAnLi4vLi4vLi4vbGliL3JlcXVpcmUudHMnO1xuaW1wb3J0IHsgZm9ybWF0RXJyb3JSZXNwb25zZSB9IGZyb20gJy4uL2Zvcm1hdFJlc3BvbnNlRXJyb3JIYW5kbGVyLnRzJztcblxuY29uc3QgeyBVSUhlbHBlciB9ID0gcmVxdWlyZSgnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9taXNjL1VJSGVscGVyLmpzJykgYXMgeyBVSUhlbHBlcjogdHlwZW9mIF9VSUhlbHBlciB9O1xuY29uc3QgeyBSb29tVHlwZSB9ID0gcmVxdWlyZSgnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vcm9vbXMvUm9vbVR5cGUuanMnKSBhcyB7IFJvb21UeXBlOiB0eXBlb2YgX1Jvb21UeXBlIH07XG5jb25zdCB7IFVzZXJUeXBlIH0gPSByZXF1aXJlKCdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi91c2Vycy9Vc2VyVHlwZS5qcycpIGFzIHsgVXNlclR5cGU6IHR5cGVvZiBfVXNlclR5cGUgfTtcbmNvbnN0IHsgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwgfSA9IHJlcXVpcmUoJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL21ldGFkYXRhL1JvY2tldENoYXRBc3NvY2lhdGlvbnMuanMnKSBhcyB7XG5cdFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsOiB0eXBlb2YgX1JvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsO1xufTtcblxuZXhwb3J0IGNsYXNzIE1vZGlmeUNyZWF0b3IgaW1wbGVtZW50cyBJTW9kaWZ5Q3JlYXRvciB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgc2VuZGVyRm46IHR5cGVvZiBNZXNzZW5nZXIuc2VuZFJlcXVlc3QpIHt9XG5cblx0Z2V0TGl2ZWNoYXRDcmVhdG9yKCk6IElMaXZlY2hhdENyZWF0b3Ige1xuXHRcdHJldHVybiBuZXcgUHJveHkoXG5cdFx0XHR7IF9fa2luZDogJ2dldExpdmVjaGF0Q3JlYXRvcicgfSxcblx0XHRcdHtcblx0XHRcdFx0Z2V0OiAoX3RhcmdldDogdW5rbm93biwgcHJvcDogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0Ly8gSXQncyBub3Qgd29ydGh3aGlsZSB0byBtYWtlIGFuIGFzeW5jaHJvbm91cyByZXF1ZXN0IGZvciBzdWNoIGEgc2ltcGxlIG1ldGhvZFxuXHRcdFx0XHRcdGlmIChwcm9wID09PSAnY3JlYXRlVG9rZW4nKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gKCkgPT4gcmFuZG9tQnl0ZXMoMTYpLnRvU3RyaW5nKCdoZXgnKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocHJvcCA9PT0gJ3RvSlNPTicpIHtcblx0XHRcdFx0XHRcdHJldHVybiAoKSA9PiAoe30pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiAoLi4ucGFyYW1zOiB1bmtub3duW10pID0+XG5cdFx0XHRcdFx0XHR0aGlzLnNlbmRlckZuKHtcblx0XHRcdFx0XHRcdFx0bWV0aG9kOiBgYWNjZXNzb3I6Z2V0TW9kaWZpZXI6Z2V0Q3JlYXRvcjpnZXRMaXZlY2hhdENyZWF0b3I6JHtwcm9wfWAsXG5cdFx0XHRcdFx0XHRcdHBhcmFtcyxcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC50aGVuKChyZXNwb25zZSkgPT4gcmVzcG9uc2UucmVzdWx0KVxuXHRcdFx0XHRcdFx0XHQuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdCkgYXMgSUxpdmVjaGF0Q3JlYXRvcjtcblx0fVxuXG5cdGdldFVwbG9hZENyZWF0b3IoKTogSVVwbG9hZENyZWF0b3Ige1xuXHRcdHJldHVybiBuZXcgUHJveHkoXG5cdFx0XHR7IF9fa2luZDogJ2dldFVwbG9hZENyZWF0b3InIH0sXG5cdFx0XHR7XG5cdFx0XHRcdGdldDpcblx0XHRcdFx0XHQoX3RhcmdldDogdW5rbm93biwgcHJvcDogc3RyaW5nKSA9PlxuXHRcdFx0XHRcdCguLi5wYXJhbXM6IHVua25vd25bXSkgPT5cblx0XHRcdFx0XHRcdHByb3AgPT09ICd0b0pTT04nXG5cdFx0XHRcdFx0XHRcdD8ge31cblx0XHRcdFx0XHRcdFx0OiB0aGlzLnNlbmRlckZuKHtcblx0XHRcdFx0XHRcdFx0XHRcdG1ldGhvZDogYGFjY2Vzc29yOmdldE1vZGlmaWVyOmdldENyZWF0b3I6Z2V0VXBsb2FkQ3JlYXRvcjoke3Byb3B9YCxcblx0XHRcdFx0XHRcdFx0XHRcdHBhcmFtcyxcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5yZXN1bHQpXG5cdFx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdH0sXG5cdFx0KSBhcyBJVXBsb2FkQ3JlYXRvcjtcblx0fVxuXG5cdGdldEVtYWlsQ3JlYXRvcigpOiBJRW1haWxDcmVhdG9yIHtcblx0XHRyZXR1cm4gbmV3IFByb3h5KFxuXHRcdFx0eyBfX2tpbmQ6ICdnZXRFbWFpbENyZWF0b3InIH0sXG5cdFx0XHR7XG5cdFx0XHRcdGdldDpcblx0XHRcdFx0XHQoX3RhcmdldDogdW5rbm93biwgcHJvcDogc3RyaW5nKSA9PlxuXHRcdFx0XHRcdCguLi5wYXJhbXM6IHVua25vd25bXSkgPT5cblx0XHRcdFx0XHRcdHByb3AgPT09ICd0b0pTT04nXG5cdFx0XHRcdFx0XHRcdD8ge31cblx0XHRcdFx0XHRcdFx0OiB0aGlzLnNlbmRlckZuKHtcblx0XHRcdFx0XHRcdFx0XHRcdG1ldGhvZDogYGFjY2Vzc29yOmdldE1vZGlmaWVyOmdldENyZWF0b3I6Z2V0RW1haWxDcmVhdG9yOiR7cHJvcH1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0cGFyYW1zLFxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHQudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLnJlc3VsdClcblx0XHRcdFx0XHRcdFx0XHRcdC5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0fSxcblx0XHQpO1xuXHR9XG5cblx0Z2V0Q29udGFjdENyZWF0b3IoKTogSUNvbnRhY3RDcmVhdG9yIHtcblx0XHRyZXR1cm4gbmV3IFByb3h5KFxuXHRcdFx0eyBfX2tpbmQ6ICdnZXRDb250YWN0Q3JlYXRvcicgfSxcblx0XHRcdHtcblx0XHRcdFx0Z2V0OlxuXHRcdFx0XHRcdChfdGFyZ2V0OiB1bmtub3duLCBwcm9wOiBzdHJpbmcpID0+XG5cdFx0XHRcdFx0KC4uLnBhcmFtczogdW5rbm93bltdKSA9PlxuXHRcdFx0XHRcdFx0cHJvcCA9PT0gJ3RvSlNPTidcblx0XHRcdFx0XHRcdFx0PyB7fVxuXHRcdFx0XHRcdFx0XHQ6IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0XHRcdFx0XHRcdFx0bWV0aG9kOiBgYWNjZXNzb3I6Z2V0TW9kaWZpZXI6Z2V0Q3JlYXRvcjpnZXRDb250YWN0Q3JlYXRvcjoke3Byb3B9YCxcblx0XHRcdFx0XHRcdFx0XHRcdHBhcmFtcyxcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5yZXN1bHQpXG5cdFx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdH0sXG5cdFx0KTtcblx0fVxuXG5cdGdldEJsb2NrQnVpbGRlcigpIHtcblx0XHRyZXR1cm4gbmV3IEJsb2NrQnVpbGRlcigpO1xuXHR9XG5cblx0c3RhcnRNZXNzYWdlKGRhdGE/OiBJTWVzc2FnZSkge1xuXHRcdGlmIChkYXRhKSB7XG5cdFx0XHRkZWxldGUgZGF0YS5pZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3IE1lc3NhZ2VCdWlsZGVyKGRhdGEpO1xuXHR9XG5cblx0c3RhcnRMaXZlY2hhdE1lc3NhZ2UoZGF0YT86IElMaXZlY2hhdE1lc3NhZ2UpIHtcblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0ZGVsZXRlIGRhdGEuaWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBMaXZlY2hhdE1lc3NhZ2VCdWlsZGVyKGRhdGEpO1xuXHR9XG5cblx0c3RhcnRSb29tKGRhdGE/OiBJUm9vbSkge1xuXHRcdGlmIChkYXRhKSB7XG5cdFx0XHQvLyBAdHMtaWdub3JlIC0gdGhpcyBoYXMgYmVlbiBpbXBvcnRlZCBmcm9tIHRoZSBBcHBzLUVuZ2luZVxuXHRcdFx0ZGVsZXRlIGRhdGEuaWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBSb29tQnVpbGRlcihkYXRhKTtcblx0fVxuXG5cdHN0YXJ0RGlzY3Vzc2lvbihkYXRhPzogUGFydGlhbDxJUm9vbT4pIHtcblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0ZGVsZXRlIGRhdGEuaWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBEaXNjdXNzaW9uQnVpbGRlcihkYXRhKTtcblx0fVxuXG5cdHN0YXJ0VmlkZW9Db25mZXJlbmNlKGRhdGE/OiBQYXJ0aWFsPEFwcFZpZGVvQ29uZmVyZW5jZT4pIHtcblx0XHRyZXR1cm4gbmV3IFZpZGVvQ29uZmVyZW5jZUJ1aWxkZXIoZGF0YSk7XG5cdH1cblxuXHRzdGFydEJvdFVzZXIoZGF0YT86IFBhcnRpYWw8SUJvdFVzZXI+KSB7XG5cdFx0aWYgKGRhdGEpIHtcblx0XHRcdGRlbGV0ZSBkYXRhLmlkO1xuXG5cdFx0XHRjb25zdCB7IHJvbGVzIH0gPSBkYXRhO1xuXG5cdFx0XHRpZiAocm9sZXM/Lmxlbmd0aCkge1xuXHRcdFx0XHRjb25zdCBoYXNSb2xlID0gcm9sZXNcblx0XHRcdFx0XHQubWFwKChyb2xlOiBzdHJpbmcpID0+IHJvbGUudG9Mb2NhbGVMb3dlckNhc2UoKSlcblx0XHRcdFx0XHQuc29tZSgocm9sZTogc3RyaW5nKSA9PiByb2xlID09PSAnYWRtaW4nIHx8IHJvbGUgPT09ICdvd25lcicgfHwgcm9sZSA9PT0gJ21vZGVyYXRvcicpO1xuXG5cdFx0XHRcdGlmIChoYXNSb2xlKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHJvbGUgYXNzaWduZWQgdG8gdGhlIHVzZXIuIFNob3VsZCBub3QgYmUgYWRtaW4sIG93bmVyIG9yIG1vZGVyYXRvci4nKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWRhdGEudHlwZSkge1xuXHRcdFx0XHRkYXRhLnR5cGUgPSBVc2VyVHlwZS5CT1Q7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBVc2VyQnVpbGRlcihkYXRhKTtcblx0fVxuXG5cdHB1YmxpYyBmaW5pc2goXG5cdFx0YnVpbGRlcjogSU1lc3NhZ2VCdWlsZGVyIHwgSUxpdmVjaGF0TWVzc2FnZUJ1aWxkZXIgfCBJUm9vbUJ1aWxkZXIgfCBJRGlzY3Vzc2lvbkJ1aWxkZXIgfCBJVmlkZW9Db25mZXJlbmNlQnVpbGRlciB8IElVc2VyQnVpbGRlcixcblx0KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRzd2l0Y2ggKGJ1aWxkZXIua2luZCkge1xuXHRcdFx0Y2FzZSBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbC5NRVNTQUdFOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fZmluaXNoTWVzc2FnZShidWlsZGVyIGFzIElNZXNzYWdlQnVpbGRlcik7XG5cdFx0XHRjYXNlIFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsLkxJVkVDSEFUX01FU1NBR0U6XG5cdFx0XHRcdHJldHVybiB0aGlzLl9maW5pc2hMaXZlY2hhdE1lc3NhZ2UoYnVpbGRlciBhcyBJTGl2ZWNoYXRNZXNzYWdlQnVpbGRlcik7XG5cdFx0XHRjYXNlIFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsLlJPT006XG5cdFx0XHRcdHJldHVybiB0aGlzLl9maW5pc2hSb29tKGJ1aWxkZXIgYXMgSVJvb21CdWlsZGVyKTtcblx0XHRcdGNhc2UgUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwuRElTQ1VTU0lPTjpcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2ZpbmlzaERpc2N1c3Npb24oYnVpbGRlciBhcyBJRGlzY3Vzc2lvbkJ1aWxkZXIpO1xuXHRcdFx0Y2FzZSBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbC5WSURFT19DT05GRVJFTkNFOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fZmluaXNoVmlkZW9Db25mZXJlbmNlKGJ1aWxkZXIgYXMgSVZpZGVvQ29uZmVyZW5jZUJ1aWxkZXIpO1xuXHRcdFx0Y2FzZSBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbC5VU0VSOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fZmluaXNoVXNlcihidWlsZGVyIGFzIElVc2VyQnVpbGRlcik7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYnVpbGRlciBwYXNzZWQgdG8gdGhlIE1vZGlmeUNyZWF0b3IuZmluaXNoIGZ1bmN0aW9uLicpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgX2ZpbmlzaE1lc3NhZ2UoYnVpbGRlcjogSU1lc3NhZ2VCdWlsZGVyKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCByZXN1bHQgPSBidWlsZGVyLmdldE1lc3NhZ2UoKTtcblx0XHRkZWxldGUgcmVzdWx0LmlkO1xuXG5cdFx0aWYgKCFyZXN1bHQuc2VuZGVyIHx8ICFyZXN1bHQuc2VuZGVyLmlkKSB7XG5cdFx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0XHRtZXRob2Q6ICdicmlkZ2VzOmdldFVzZXJCcmlkZ2U6ZG9HZXRBcHBVc2VyJyxcblx0XHRcdFx0cGFyYW1zOiBbJ0FQUF9JRCddLFxuXHRcdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgYXBwVXNlciA9IHJlc3BvbnNlLnJlc3VsdDtcblxuXHRcdFx0aWYgKCFhcHBVc2VyKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzZW5kZXIgYXNzaWduZWQgdG8gdGhlIG1lc3NhZ2UuJyk7XG5cdFx0XHR9XG5cblx0XHRcdHJlc3VsdC5zZW5kZXIgPSBhcHBVc2VyO1xuXHRcdH1cblxuXHRcdGlmIChyZXN1bHQuYmxvY2tzPy5sZW5ndGgpIHtcblx0XHRcdC8vIENhbiB3ZSBtb3ZlIHRoaXMgZWxzZXdoZXJlPyBUaGlzIEFwcE9iamVjdFJlZ2lzdHJ5IHVzYWdlIGRvZXNuJ3QgcmVhbGx5IGJlbG9uZyBoZXJlLCBidXQgd2hlcmU/XG5cdFx0XHRyZXN1bHQuYmxvY2tzID0gVUlIZWxwZXIuYXNzaWduSWRzKHJlc3VsdC5ibG9ja3MsIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKSB8fCAnJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnNlbmRlckZuKHtcblx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0TWVzc2FnZUJyaWRnZTpkb0NyZWF0ZScsXG5cdFx0XHRwYXJhbXM6IFtyZXN1bHQsIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFN0cmluZyhyZXNwb25zZS5yZXN1bHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBfZmluaXNoTGl2ZWNoYXRNZXNzYWdlKGJ1aWxkZXI6IElMaXZlY2hhdE1lc3NhZ2VCdWlsZGVyKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRpZiAoYnVpbGRlci5nZXRTZW5kZXIoKSAmJiAhYnVpbGRlci5nZXRWaXNpdG9yKCkpIHtcblx0XHRcdHJldHVybiB0aGlzLl9maW5pc2hNZXNzYWdlKGJ1aWxkZXIuZ2V0TWVzc2FnZUJ1aWxkZXIoKSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzdWx0ID0gYnVpbGRlci5nZXRNZXNzYWdlKCk7XG5cdFx0ZGVsZXRlIHJlc3VsdC5pZDtcblxuXHRcdGlmICghcmVzdWx0LnRva2VuICYmICghcmVzdWx0LnZpc2l0b3IgfHwgIXJlc3VsdC52aXNpdG9yLnRva2VuKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZpc2l0b3Igc2VuZGluZyB0aGUgbWVzc2FnZScpO1xuXHRcdH1cblxuXHRcdHJlc3VsdC50b2tlbiA9IHJlc3VsdC52aXNpdG9yID8gcmVzdWx0LnZpc2l0b3IudG9rZW4gOiByZXN1bHQudG9rZW47XG5cblx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRMaXZlY2hhdEJyaWRnZTpkb0NyZWF0ZU1lc3NhZ2UnLFxuXHRcdFx0cGFyYW1zOiBbcmVzdWx0LCBBcHBPYmplY3RSZWdpc3RyeS5nZXQoJ2lkJyldLFxuXHRcdH0pLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBTdHJpbmcocmVzcG9uc2UucmVzdWx0KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgX2ZpbmlzaFJvb20oYnVpbGRlcjogSVJvb21CdWlsZGVyKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCByZXN1bHQgPSBidWlsZGVyLmdldFJvb20oKTtcblx0XHRkZWxldGUgcmVzdWx0LmlkO1xuXG5cdFx0aWYgKCFyZXN1bHQudHlwZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHR5cGUgYXNzaWduZWQgdG8gdGhlIHJvb20uJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHJlc3VsdC50eXBlICE9PSBSb29tVHlwZS5MSVZFX0NIQVQpIHtcblx0XHRcdGlmICghcmVzdWx0LmNyZWF0b3IgfHwgIXJlc3VsdC5jcmVhdG9yLmlkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjcmVhdG9yIGFzc2lnbmVkIHRvIHRoZSByb29tLicpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChyZXN1bHQudHlwZSAhPT0gUm9vbVR5cGUuRElSRUNUX01FU1NBR0UpIHtcblx0XHRcdGlmIChyZXN1bHQudHlwZSAhPT0gUm9vbVR5cGUuTElWRV9DSEFUKSB7XG5cdFx0XHRcdGlmICghcmVzdWx0LnNsdWdpZmllZE5hbWUgfHwgIXJlc3VsdC5zbHVnaWZpZWROYW1lLnRyaW0oKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzbHVnaWZpZWROYW1lIGFzc2lnbmVkIHRvIHRoZSByb29tLicpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICghcmVzdWx0LmRpc3BsYXlOYW1lIHx8ICFyZXN1bHQuZGlzcGxheU5hbWUudHJpbSgpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBkaXNwbGF5TmFtZSBhc3NpZ25lZCB0byB0aGUgcm9vbS4nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuc2VuZGVyRm4oe1xuXHRcdFx0bWV0aG9kOiAnYnJpZGdlczpnZXRSb29tQnJpZGdlOmRvQ3JlYXRlJyxcblx0XHRcdHBhcmFtczogW3Jlc3VsdCwgYnVpbGRlci5nZXRNZW1iZXJzVG9CZUFkZGVkVXNlcm5hbWVzKCksIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFN0cmluZyhyZXNwb25zZS5yZXN1bHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBfZmluaXNoRGlzY3Vzc2lvbihidWlsZGVyOiBJRGlzY3Vzc2lvbkJ1aWxkZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGNvbnN0IHJvb20gPSBidWlsZGVyLmdldFJvb20oKTtcblx0XHRkZWxldGUgcm9vbS5pZDtcblxuXHRcdGlmICghcm9vbS5jcmVhdG9yIHx8ICFyb29tLmNyZWF0b3IuaWQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjcmVhdG9yIGFzc2lnbmVkIHRvIHRoZSBkaXNjdXNzaW9uLicpO1xuXHRcdH1cblxuXHRcdGlmICghcm9vbS5zbHVnaWZpZWROYW1lIHx8ICFyb29tLnNsdWdpZmllZE5hbWUudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc2x1Z2lmaWVkTmFtZSBhc3NpZ25lZCB0byB0aGUgZGlzY3Vzc2lvbi4nKTtcblx0XHR9XG5cblx0XHRpZiAoIXJvb20uZGlzcGxheU5hbWUgfHwgIXJvb20uZGlzcGxheU5hbWUudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlzcGxheU5hbWUgYXNzaWduZWQgdG8gdGhlIGRpc2N1c3Npb24uJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tLnBhcmVudFJvb20gfHwgIXJvb20ucGFyZW50Um9vbS5pZCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhcmVudFJvb20gYXNzaWduZWQgdG8gdGhlIGRpc2N1c3Npb24uJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnNlbmRlckZuKHtcblx0XHRcdG1ldGhvZDogJ2JyaWRnZXM6Z2V0Um9vbUJyaWRnZTpkb0NyZWF0ZURpc2N1c3Npb24nLFxuXHRcdFx0cGFyYW1zOiBbcm9vbSwgYnVpbGRlci5nZXRQYXJlbnRNZXNzYWdlKCksIGJ1aWxkZXIuZ2V0UmVwbHkoKSwgYnVpbGRlci5nZXRNZW1iZXJzVG9CZUFkZGVkVXNlcm5hbWVzKCksIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFN0cmluZyhyZXNwb25zZS5yZXN1bHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBfZmluaXNoVmlkZW9Db25mZXJlbmNlKGJ1aWxkZXI6IElWaWRlb0NvbmZlcmVuY2VCdWlsZGVyKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCB2aWRlb0NvbmZlcmVuY2UgPSBidWlsZGVyLmdldFZpZGVvQ29uZmVyZW5jZSgpO1xuXG5cdFx0aWYgKCF2aWRlb0NvbmZlcmVuY2UuY3JlYXRlZEJ5KSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY3JlYXRvciBhc3NpZ25lZCB0byB0aGUgdmlkZW8gY29uZmVyZW5jZS4nKTtcblx0XHR9XG5cblx0XHRpZiAoIXZpZGVvQ29uZmVyZW5jZS5wcm92aWRlck5hbWU/LnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHByb3ZpZGVyIG5hbWUgYXNzaWduZWQgdG8gdGhlIHZpZGVvIGNvbmZlcmVuY2UuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF2aWRlb0NvbmZlcmVuY2UucmlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcm9vbUlkIGFzc2lnbmVkIHRvIHRoZSB2aWRlbyBjb25mZXJlbmNlLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRtZXRob2Q6ICdicmlkZ2VzOmdldFZpZGVvQ29uZmVyZW5jZUJyaWRnZTpkb0NyZWF0ZScsXG5cdFx0XHRwYXJhbXM6IFt2aWRlb0NvbmZlcmVuY2UsIEFwcE9iamVjdFJlZ2lzdHJ5LmdldCgnaWQnKV0sXG5cdFx0fSkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhyb3cgZm9ybWF0RXJyb3JSZXNwb25zZShlcnIpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFN0cmluZyhyZXNwb25zZS5yZXN1bHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBfZmluaXNoVXNlcihidWlsZGVyOiBJVXNlckJ1aWxkZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGNvbnN0IHVzZXIgPSBidWlsZGVyLmdldFVzZXIoKTtcblxuXHRcdGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5zZW5kZXJGbih7XG5cdFx0XHRtZXRob2Q6ICdicmlkZ2VzOmdldFVzZXJCcmlkZ2U6ZG9DcmVhdGUnLFxuXHRcdFx0cGFyYW1zOiBbdXNlciwgQXBwT2JqZWN0UmVnaXN0cnkuZ2V0KCdpZCcpXSxcblx0XHR9KS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gU3RyaW5nKHJlc3BvbnNlLnJlc3VsdCk7XG5cdH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtQkEsU0FBUyxXQUFXLFFBQVEsY0FBYztBQUUxQyxTQUFTLFlBQVksUUFBUSw4QkFBOEI7QUFDM0QsU0FBUyxjQUFjLFFBQVEsZ0NBQWdDO0FBQy9ELFNBQVMsaUJBQWlCLFFBQTRCLG1DQUFtQztBQUN6RixTQUEyQixzQkFBc0IsUUFBUSx3Q0FBd0M7QUFDakcsU0FBUyxXQUFXLFFBQVEsNkJBQTZCO0FBQ3pELFNBQVMsV0FBVyxRQUFRLDZCQUE2QjtBQUN6RCxTQUE2QixzQkFBc0IsUUFBUSx3Q0FBd0M7QUFDbkcsU0FBUyxpQkFBaUIsUUFBUSxnQ0FBZ0M7QUFDbEUsU0FBUyxPQUFPLFFBQVEsMEJBQTBCO0FBQ2xELFNBQVMsbUJBQW1CLFFBQVEsbUNBQW1DO0FBRXZFLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxRQUFRO0FBQzdCLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxRQUFRO0FBQzdCLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxRQUFRO0FBQzdCLE1B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