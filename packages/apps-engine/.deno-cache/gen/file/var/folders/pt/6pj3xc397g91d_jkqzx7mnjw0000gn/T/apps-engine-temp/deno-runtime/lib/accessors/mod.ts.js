import { Http } from './http.ts';
import { HttpExtend } from './extenders/HttpExtender.ts';
import * as Messenger from '../messenger.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { ModifyCreator } from './modify/ModifyCreator.ts';
import { ModifyUpdater } from './modify/ModifyUpdater.ts';
import { ModifyExtender } from './modify/ModifyExtender.ts';
import { Notifier } from './notifier.ts';
import { formatErrorResponse } from './formatResponseErrorHandler.ts';
const httpMethods = [
  'get',
  'post',
  'put',
  'delete',
  'head',
  'options',
  'patch'
];
// We need to create this object first thing, as we'll handle references to it later on
if (!AppObjectRegistry.has('apiEndpoints')) {
  AppObjectRegistry.set('apiEndpoints', []);
}
export class AppAccessors {
  senderFn;
  defaultAppAccessors;
  environmentRead;
  environmentWriter;
  configModifier;
  configExtender;
  reader;
  modifier;
  persistence;
  creator;
  updater;
  extender;
  httpExtend;
  http;
  notifier;
  proxify;
  constructor(senderFn){
    this.senderFn = senderFn;
    this.httpExtend = new HttpExtend();
    this.proxify = (namespace, overrides = {})=>new Proxy({
        __kind: `accessor:${namespace}`
      }, {
        get: (_target, prop)=>(...params)=>{
            // We don't want to send a request for this prop
            if (prop === 'toJSON') {
              return {};
            }
            // If the prop is inteded to be overriden by the caller
            if (prop in overrides) {
              return overrides[prop].apply(undefined, params);
            }
            return senderFn({
              method: `accessor:${namespace}:${prop}`,
              params
            }).then((response)=>response.result).catch((err)=>{
              throw formatErrorResponse(err);
            });
          }
      });
    this.http = new Http(this.getReader(), this.getPersistence(), this.httpExtend, this.getSenderFn());
    this.notifier = new Notifier(this.getSenderFn());
  }
  getSenderFn() {
    return this.senderFn;
  }
  getEnvironmentRead() {
    if (!this.environmentRead) {
      this.environmentRead = {
        getSettings: ()=>this.proxify('getEnvironmentRead:getSettings'),
        getServerSettings: ()=>this.proxify('getEnvironmentRead:getServerSettings'),
        getEnvironmentVariables: ()=>this.proxify('getEnvironmentRead:getEnvironmentVariables')
      };
    }
    return this.environmentRead;
  }
  getEnvironmentWrite() {
    if (!this.environmentWriter) {
      this.environmentWriter = {
        getSettings: ()=>this.proxify('getEnvironmentWrite:getSettings'),
        getServerSettings: ()=>this.proxify('getEnvironmentWrite:getServerSettings')
      };
    }
    return this.environmentWriter;
  }
  getConfigurationModify() {
    if (!this.configModifier) {
      this.configModifier = {
        scheduler: this.proxify('getConfigurationModify:scheduler'),
        slashCommands: {
          _proxy: this.proxify('getConfigurationModify:slashCommands'),
          modifySlashCommand (slashcommand) {
            // Store the slashcommand instance to use when the Apps-Engine calls the slashcommand
            AppObjectRegistry.set(`slashcommand:${slashcommand.command}`, slashcommand);
            return this._proxy.modifySlashCommand(slashcommand);
          },
          disableSlashCommand (command) {
            return this._proxy.disableSlashCommand(command);
          },
          enableSlashCommand (command) {
            return this._proxy.enableSlashCommand(command);
          }
        },
        serverSettings: this.proxify('getConfigurationModify:serverSettings')
      };
    }
    return this.configModifier;
  }
  getConfigurationExtend() {
    if (!this.configExtender) {
      const senderFn = this.senderFn;
      this.configExtender = {
        ui: this.proxify('getConfigurationExtend:ui'),
        http: this.httpExtend,
        settings: this.proxify('getConfigurationExtend:settings'),
        externalComponents: this.proxify('getConfigurationExtend:externalComponents'),
        api: {
          _proxy: this.proxify('getConfigurationExtend:api'),
          async provideApi (api) {
            const apiEndpoints = AppObjectRegistry.get('apiEndpoints');
            api.endpoints.forEach((endpoint)=>{
              endpoint._availableMethods = httpMethods.filter((method)=>typeof endpoint[method] === 'function');
              // We need to keep a reference to the endpoint around for us to call the executor later
              AppObjectRegistry.set(`api:${endpoint.path}`, endpoint);
            });
            const result = await this._proxy.provideApi(api);
            // Let's call the listApis method to cache the info from the endpoints
            // Also, since this is a side-effect, we do it async so we can return to the caller
            senderFn({
              method: 'accessor:api:listApis'
            }).then((response)=>apiEndpoints.push(...response.result)).catch((err)=>err.error);
            return result;
          }
        },
        scheduler: {
          _proxy: this.proxify('getConfigurationExtend:scheduler'),
          registerProcessors (processors) {
            // Store the processor instance to use when the Apps-Engine calls the processor
            processors.forEach((processor)=>{
              AppObjectRegistry.set(`scheduler:${processor.id}`, processor);
            });
            return this._proxy.registerProcessors(processors);
          }
        },
        videoConfProviders: {
          _proxy: this.proxify('getConfigurationExtend:videoConfProviders'),
          provideVideoConfProvider (provider) {
            // Store the videoConfProvider instance to use when the Apps-Engine calls the videoConfProvider
            AppObjectRegistry.set(`videoConfProvider:${provider.name}`, provider);
            return this._proxy.provideVideoConfProvider(provider);
          }
        },
        outboundCommunication: {
          _proxy: this.proxify('getConfigurationExtend:outboundCommunication'),
          registerEmailProvider (provider) {
            AppObjectRegistry.set(`outboundCommunication:${provider.name}-${provider.type}`, provider);
            return this._proxy.registerEmailProvider(provider);
          },
          registerPhoneProvider (provider) {
            AppObjectRegistry.set(`outboundCommunication:${provider.name}-${provider.type}`, provider);
            return this._proxy.registerPhoneProvider(provider);
          }
        },
        slashCommands: {
          _proxy: this.proxify('getConfigurationExtend:slashCommands'),
          provideSlashCommand (slashcommand) {
            // Store the slashcommand instance to use when the Apps-Engine calls the slashcommand
            AppObjectRegistry.set(`slashcommand:${slashcommand.command}`, slashcommand);
            return this._proxy.provideSlashCommand(slashcommand);
          }
        }
      };
    }
    return this.configExtender;
  }
  getDefaultAppAccessors() {
    if (!this.defaultAppAccessors) {
      this.defaultAppAccessors = {
        environmentReader: this.getEnvironmentRead(),
        environmentWriter: this.getEnvironmentWrite(),
        reader: this.getReader(),
        http: this.getHttp(),
        providedApiEndpoints: AppObjectRegistry.get('apiEndpoints')
      };
    }
    return this.defaultAppAccessors;
  }
  getReader() {
    if (!this.reader) {
      this.reader = {
        getEnvironmentReader: ()=>({
            getSettings: ()=>this.proxify('getReader:getEnvironmentReader:getSettings'),
            getServerSettings: ()=>this.proxify('getReader:getEnvironmentReader:getServerSettings'),
            getEnvironmentVariables: ()=>this.proxify('getReader:getEnvironmentReader:getEnvironmentVariables')
          }),
        getMessageReader: ()=>this.proxify('getReader:getMessageReader'),
        getPersistenceReader: ()=>this.proxify('getReader:getPersistenceReader'),
        getRoomReader: ()=>this.proxify('getReader:getRoomReader'),
        getUserReader: ()=>this.proxify('getReader:getUserReader'),
        getNotifier: ()=>this.getNotifier(),
        getLivechatReader: ()=>this.proxify('getReader:getLivechatReader'),
        getUploadReader: ()=>this.proxify('getReader:getUploadReader'),
        getCloudWorkspaceReader: ()=>this.proxify('getReader:getCloudWorkspaceReader'),
        getVideoConferenceReader: ()=>this.proxify('getReader:getVideoConferenceReader'),
        getOAuthAppsReader: ()=>this.proxify('getReader:getOAuthAppsReader'),
        getThreadReader: ()=>this.proxify('getReader:getThreadReader'),
        getRoleReader: ()=>this.proxify('getReader:getRoleReader'),
        getContactReader: ()=>this.proxify('getReader:getContactReader'),
        getExperimentalReader: ()=>this.proxify('getReader:getExperimentalReader')
      };
    }
    return this.reader;
  }
  getModifier() {
    if (!this.modifier) {
      this.modifier = {
        getCreator: this.getCreator.bind(this),
        getUpdater: this.getUpdater.bind(this),
        getExtender: this.getExtender.bind(this),
        getDeleter: ()=>this.proxify('getModifier:getDeleter'),
        getNotifier: ()=>this.getNotifier(),
        getUiController: ()=>this.proxify('getModifier:getUiController'),
        getScheduler: ()=>this.proxify('getModifier:getScheduler'),
        getOAuthAppsModifier: ()=>this.proxify('getModifier:getOAuthAppsModifier'),
        getModerationModifier: ()=>this.proxify('getModifier:getModerationModifier')
      };
    }
    return this.modifier;
  }
  getPersistence() {
    if (!this.persistence) {
      this.persistence = this.proxify('getPersistence');
    }
    return this.persistence;
  }
  getHttp() {
    return this.http;
  }
  getCreator() {
    if (!this.creator) {
      this.creator = new ModifyCreator(this.senderFn);
    }
    return this.creator;
  }
  getUpdater() {
    if (!this.updater) {
      this.updater = new ModifyUpdater(this.senderFn);
    }
    return this.updater;
  }
  getExtender() {
    if (!this.extender) {
      this.extender = new ModifyExtender(this.senderFn);
    }
    return this.extender;
  }
  getNotifier() {
    return this.notifier;
  }
}
export const AppAccessorsInstance = new AppAccessors(Messenger.sendRequest);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdmFyL2ZvbGRlcnMvcHQvNnBqM3hjMzk3ZzkxZF9qa3F6eDdtbmp3MDAwMGduL1QvYXBwcy1lbmdpbmUtdGVtcC9kZW5vLXJ1bnRpbWUvbGliL2FjY2Vzc29ycy9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJQXBwQWNjZXNzb3JzIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lBcHBBY2Nlc3NvcnMudHMnO1xuaW1wb3J0IHR5cGUgeyBJQXBpRW5kcG9pbnRNZXRhZGF0YSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FwaS9JQXBpRW5kcG9pbnRNZXRhZGF0YS50cyc7XG5pbXBvcnQgdHlwZSB7IElFbnZpcm9ubWVudFdyaXRlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lFbnZpcm9ubWVudFdyaXRlLnRzJztcbmltcG9ydCB0eXBlIHsgSUVudmlyb25tZW50UmVhZCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JRW52aXJvbm1lbnRSZWFkLnRzJztcbmltcG9ydCB0eXBlIHsgSUNvbmZpZ3VyYXRpb25Nb2RpZnkgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSUNvbmZpZ3VyYXRpb25Nb2RpZnkudHMnO1xuaW1wb3J0IHR5cGUgeyBJUmVhZCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JUmVhZC50cyc7XG5pbXBvcnQgdHlwZSB7IElNb2RpZnkgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSU1vZGlmeS50cyc7XG5pbXBvcnQgdHlwZSB7IElOb3RpZmllciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JTm90aWZpZXIudHMnO1xuaW1wb3J0IHR5cGUgeyBJUGVyc2lzdGVuY2UgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSVBlcnNpc3RlbmNlLnRzJztcbmltcG9ydCB0eXBlIHsgSUh0dHAsIElIdHRwRXh0ZW5kIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lIdHRwLnRzJztcbmltcG9ydCB0eXBlIHsgSUNvbmZpZ3VyYXRpb25FeHRlbmQgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSUNvbmZpZ3VyYXRpb25FeHRlbmQudHMnO1xuaW1wb3J0IHR5cGUgeyBJU2xhc2hDb21tYW5kIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vc2xhc2hjb21tYW5kcy9JU2xhc2hDb21tYW5kLnRzJztcbmltcG9ydCB0eXBlIHsgSVByb2Nlc3NvciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL3NjaGVkdWxlci9JUHJvY2Vzc29yLnRzJztcbmltcG9ydCB0eXBlIHsgSUFwaSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FwaS9JQXBpLnRzJztcbmltcG9ydCB0eXBlIHsgSVZpZGVvQ29uZlByb3ZpZGVyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vdmlkZW9Db25mUHJvdmlkZXJzL0lWaWRlb0NvbmZQcm92aWRlci50cyc7XG5pbXBvcnQgdHlwZSB7XG5cdElPdXRib3VuZFBob25lTWVzc2FnZVByb3ZpZGVyLFxuXHRJT3V0Ym91bmRFbWFpbE1lc3NhZ2VQcm92aWRlcixcbn0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vb3V0Ym91bmRDb21tdW5pY2F0aW9uL0lPdXRib3VuZENvbW1zUHJvdmlkZXIudHMnO1xuXG5pbXBvcnQgeyBIdHRwIH0gZnJvbSAnLi9odHRwLnRzJztcbmltcG9ydCB7IEh0dHBFeHRlbmQgfSBmcm9tICcuL2V4dGVuZGVycy9IdHRwRXh0ZW5kZXIudHMnO1xuaW1wb3J0ICogYXMgTWVzc2VuZ2VyIGZyb20gJy4uL21lc3Nlbmdlci50cyc7XG5pbXBvcnQgeyBBcHBPYmplY3RSZWdpc3RyeSB9IGZyb20gJy4uLy4uL0FwcE9iamVjdFJlZ2lzdHJ5LnRzJztcbmltcG9ydCB7IE1vZGlmeUNyZWF0b3IgfSBmcm9tICcuL21vZGlmeS9Nb2RpZnlDcmVhdG9yLnRzJztcbmltcG9ydCB7IE1vZGlmeVVwZGF0ZXIgfSBmcm9tICcuL21vZGlmeS9Nb2RpZnlVcGRhdGVyLnRzJztcbmltcG9ydCB7IE1vZGlmeUV4dGVuZGVyIH0gZnJvbSAnLi9tb2RpZnkvTW9kaWZ5RXh0ZW5kZXIudHMnO1xuaW1wb3J0IHsgTm90aWZpZXIgfSBmcm9tICcuL25vdGlmaWVyLnRzJztcbmltcG9ydCB7IGZvcm1hdEVycm9yUmVzcG9uc2UgfSBmcm9tICcuL2Zvcm1hdFJlc3BvbnNlRXJyb3JIYW5kbGVyLnRzJztcblxuY29uc3QgaHR0cE1ldGhvZHMgPSBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnLCAnaGVhZCcsICdvcHRpb25zJywgJ3BhdGNoJ10gYXMgY29uc3Q7XG5cbi8vIFdlIG5lZWQgdG8gY3JlYXRlIHRoaXMgb2JqZWN0IGZpcnN0IHRoaW5nLCBhcyB3ZSdsbCBoYW5kbGUgcmVmZXJlbmNlcyB0byBpdCBsYXRlciBvblxuaWYgKCFBcHBPYmplY3RSZWdpc3RyeS5oYXMoJ2FwaUVuZHBvaW50cycpKSB7XG5cdEFwcE9iamVjdFJlZ2lzdHJ5LnNldCgnYXBpRW5kcG9pbnRzJywgW10pO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwQWNjZXNzb3JzIHtcblx0cHJpdmF0ZSBkZWZhdWx0QXBwQWNjZXNzb3JzPzogSUFwcEFjY2Vzc29ycztcblx0cHJpdmF0ZSBlbnZpcm9ubWVudFJlYWQ/OiBJRW52aXJvbm1lbnRSZWFkO1xuXHRwcml2YXRlIGVudmlyb25tZW50V3JpdGVyPzogSUVudmlyb25tZW50V3JpdGU7XG5cdHByaXZhdGUgY29uZmlnTW9kaWZpZXI/OiBJQ29uZmlndXJhdGlvbk1vZGlmeTtcblx0cHJpdmF0ZSBjb25maWdFeHRlbmRlcj86IElDb25maWd1cmF0aW9uRXh0ZW5kO1xuXHRwcml2YXRlIHJlYWRlcj86IElSZWFkO1xuXHRwcml2YXRlIG1vZGlmaWVyPzogSU1vZGlmeTtcblx0cHJpdmF0ZSBwZXJzaXN0ZW5jZT86IElQZXJzaXN0ZW5jZTtcblx0cHJpdmF0ZSBjcmVhdG9yPzogTW9kaWZ5Q3JlYXRvcjtcblx0cHJpdmF0ZSB1cGRhdGVyPzogTW9kaWZ5VXBkYXRlcjtcblx0cHJpdmF0ZSBleHRlbmRlcj86IE1vZGlmeUV4dGVuZGVyO1xuXHRwcml2YXRlIGh0dHBFeHRlbmQ6IElIdHRwRXh0ZW5kID0gbmV3IEh0dHBFeHRlbmQoKTtcblx0cHJpdmF0ZSBodHRwPzogSUh0dHA7XG5cdHByaXZhdGUgbm90aWZpZXI/OiBJTm90aWZpZXI7XG5cblx0cHJpdmF0ZSBwcm94aWZ5OiA8VD4obmFtZXNwYWNlOiBzdHJpbmcsIG92ZXJyaWRlcz86IFJlY29yZDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24+KSA9PiBUO1xuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgc2VuZGVyRm46IHR5cGVvZiBNZXNzZW5nZXIuc2VuZFJlcXVlc3QpIHtcblx0XHR0aGlzLnByb3hpZnkgPSA8VD4obmFtZXNwYWNlOiBzdHJpbmcsIG92ZXJyaWRlczogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdW5rbm93bj4gPSB7fSk6IFQgPT5cblx0XHRcdG5ldyBQcm94eShcblx0XHRcdFx0eyBfX2tpbmQ6IGBhY2Nlc3Nvcjoke25hbWVzcGFjZX1gIH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRnZXQ6XG5cdFx0XHRcdFx0XHQoX3RhcmdldDogdW5rbm93biwgcHJvcDogc3RyaW5nKSA9PlxuXHRcdFx0XHRcdFx0KC4uLnBhcmFtczogdW5rbm93bltdKSA9PiB7XG5cdFx0XHRcdFx0XHRcdC8vIFdlIGRvbid0IHdhbnQgdG8gc2VuZCBhIHJlcXVlc3QgZm9yIHRoaXMgcHJvcFxuXHRcdFx0XHRcdFx0XHRpZiAocHJvcCA9PT0gJ3RvSlNPTicpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4ge307XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvLyBJZiB0aGUgcHJvcCBpcyBpbnRlZGVkIHRvIGJlIG92ZXJyaWRlbiBieSB0aGUgY2FsbGVyXG5cdFx0XHRcdFx0XHRcdGlmIChwcm9wIGluIG92ZXJyaWRlcykge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBvdmVycmlkZXNbcHJvcF0uYXBwbHkodW5kZWZpbmVkLCBwYXJhbXMpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHNlbmRlckZuKHtcblx0XHRcdFx0XHRcdFx0XHRtZXRob2Q6IGBhY2Nlc3Nvcjoke25hbWVzcGFjZX06JHtwcm9wfWAsXG5cdFx0XHRcdFx0XHRcdFx0cGFyYW1zLFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKChyZXNwb25zZSkgPT4gcmVzcG9uc2UucmVzdWx0KVxuXHRcdFx0XHRcdFx0XHRcdC5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aHJvdyBmb3JtYXRFcnJvclJlc3BvbnNlKGVycik7XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0KSBhcyBUO1xuXG5cdFx0dGhpcy5odHRwID0gbmV3IEh0dHAodGhpcy5nZXRSZWFkZXIoKSwgdGhpcy5nZXRQZXJzaXN0ZW5jZSgpLCB0aGlzLmh0dHBFeHRlbmQsIHRoaXMuZ2V0U2VuZGVyRm4oKSk7XG5cdFx0dGhpcy5ub3RpZmllciA9IG5ldyBOb3RpZmllcih0aGlzLmdldFNlbmRlckZuKCkpO1xuXHR9XG5cblx0cHVibGljIGdldFNlbmRlckZuKCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmRlckZuO1xuXHR9XG5cblx0cHVibGljIGdldEVudmlyb25tZW50UmVhZCgpOiBJRW52aXJvbm1lbnRSZWFkIHtcblx0XHRpZiAoIXRoaXMuZW52aXJvbm1lbnRSZWFkKSB7XG5cdFx0XHR0aGlzLmVudmlyb25tZW50UmVhZCA9IHtcblx0XHRcdFx0Z2V0U2V0dGluZ3M6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0RW52aXJvbm1lbnRSZWFkOmdldFNldHRpbmdzJyksXG5cdFx0XHRcdGdldFNlcnZlclNldHRpbmdzOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldEVudmlyb25tZW50UmVhZDpnZXRTZXJ2ZXJTZXR0aW5ncycpLFxuXHRcdFx0XHRnZXRFbnZpcm9ubWVudFZhcmlhYmxlczogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRFbnZpcm9ubWVudFJlYWQ6Z2V0RW52aXJvbm1lbnRWYXJpYWJsZXMnKSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuZW52aXJvbm1lbnRSZWFkO1xuXHR9XG5cblx0cHVibGljIGdldEVudmlyb25tZW50V3JpdGUoKSB7XG5cdFx0aWYgKCF0aGlzLmVudmlyb25tZW50V3JpdGVyKSB7XG5cdFx0XHR0aGlzLmVudmlyb25tZW50V3JpdGVyID0ge1xuXHRcdFx0XHRnZXRTZXR0aW5nczogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRFbnZpcm9ubWVudFdyaXRlOmdldFNldHRpbmdzJyksXG5cdFx0XHRcdGdldFNlcnZlclNldHRpbmdzOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldEVudmlyb25tZW50V3JpdGU6Z2V0U2VydmVyU2V0dGluZ3MnKSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuZW52aXJvbm1lbnRXcml0ZXI7XG5cdH1cblxuXHRwdWJsaWMgZ2V0Q29uZmlndXJhdGlvbk1vZGlmeSgpIHtcblx0XHRpZiAoIXRoaXMuY29uZmlnTW9kaWZpZXIpIHtcblx0XHRcdHRoaXMuY29uZmlnTW9kaWZpZXIgPSB7XG5cdFx0XHRcdHNjaGVkdWxlcjogdGhpcy5wcm94aWZ5KCdnZXRDb25maWd1cmF0aW9uTW9kaWZ5OnNjaGVkdWxlcicpLFxuXHRcdFx0XHRzbGFzaENvbW1hbmRzOiB7XG5cdFx0XHRcdFx0X3Byb3h5OiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25Nb2RpZnk6c2xhc2hDb21tYW5kcycpLFxuXHRcdFx0XHRcdG1vZGlmeVNsYXNoQ29tbWFuZChzbGFzaGNvbW1hbmQ6IElTbGFzaENvbW1hbmQpIHtcblx0XHRcdFx0XHRcdC8vIFN0b3JlIHRoZSBzbGFzaGNvbW1hbmQgaW5zdGFuY2UgdG8gdXNlIHdoZW4gdGhlIEFwcHMtRW5naW5lIGNhbGxzIHRoZSBzbGFzaGNvbW1hbmRcblx0XHRcdFx0XHRcdEFwcE9iamVjdFJlZ2lzdHJ5LnNldChgc2xhc2hjb21tYW5kOiR7c2xhc2hjb21tYW5kLmNvbW1hbmR9YCwgc2xhc2hjb21tYW5kKTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3Byb3h5Lm1vZGlmeVNsYXNoQ29tbWFuZChzbGFzaGNvbW1hbmQpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZGlzYWJsZVNsYXNoQ29tbWFuZChjb21tYW5kOiBzdHJpbmcpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLl9wcm94eS5kaXNhYmxlU2xhc2hDb21tYW5kKGNvbW1hbmQpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZW5hYmxlU2xhc2hDb21tYW5kKGNvbW1hbmQ6IHN0cmluZykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3Byb3h5LmVuYWJsZVNsYXNoQ29tbWFuZChjb21tYW5kKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzZXJ2ZXJTZXR0aW5nczogdGhpcy5wcm94aWZ5KCdnZXRDb25maWd1cmF0aW9uTW9kaWZ5OnNlcnZlclNldHRpbmdzJyksXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmNvbmZpZ01vZGlmaWVyO1xuXHR9XG5cblx0cHVibGljIGdldENvbmZpZ3VyYXRpb25FeHRlbmQoKSB7XG5cdFx0aWYgKCF0aGlzLmNvbmZpZ0V4dGVuZGVyKSB7XG5cdFx0XHRjb25zdCBzZW5kZXJGbiA9IHRoaXMuc2VuZGVyRm47XG5cblx0XHRcdHRoaXMuY29uZmlnRXh0ZW5kZXIgPSB7XG5cdFx0XHRcdHVpOiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25FeHRlbmQ6dWknKSxcblx0XHRcdFx0aHR0cDogdGhpcy5odHRwRXh0ZW5kLFxuXHRcdFx0XHRzZXR0aW5nczogdGhpcy5wcm94aWZ5KCdnZXRDb25maWd1cmF0aW9uRXh0ZW5kOnNldHRpbmdzJyksXG5cdFx0XHRcdGV4dGVybmFsQ29tcG9uZW50czogdGhpcy5wcm94aWZ5KCdnZXRDb25maWd1cmF0aW9uRXh0ZW5kOmV4dGVybmFsQ29tcG9uZW50cycpLFxuXHRcdFx0XHRhcGk6IHtcblx0XHRcdFx0XHRfcHJveHk6IHRoaXMucHJveGlmeSgnZ2V0Q29uZmlndXJhdGlvbkV4dGVuZDphcGknKSxcblx0XHRcdFx0XHRhc3luYyBwcm92aWRlQXBpKGFwaTogSUFwaSkge1xuXHRcdFx0XHRcdFx0Y29uc3QgYXBpRW5kcG9pbnRzID0gQXBwT2JqZWN0UmVnaXN0cnkuZ2V0PElBcGlFbmRwb2ludE1ldGFkYXRhW10+KCdhcGlFbmRwb2ludHMnKSE7XG5cblx0XHRcdFx0XHRcdGFwaS5lbmRwb2ludHMuZm9yRWFjaCgoZW5kcG9pbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0ZW5kcG9pbnQuX2F2YWlsYWJsZU1ldGhvZHMgPSBodHRwTWV0aG9kcy5maWx0ZXIoKG1ldGhvZCkgPT4gdHlwZW9mIGVuZHBvaW50W21ldGhvZF0gPT09ICdmdW5jdGlvbicpO1xuXG5cdFx0XHRcdFx0XHRcdC8vIFdlIG5lZWQgdG8ga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgZW5kcG9pbnQgYXJvdW5kIGZvciB1cyB0byBjYWxsIHRoZSBleGVjdXRvciBsYXRlclxuXHRcdFx0XHRcdFx0XHRBcHBPYmplY3RSZWdpc3RyeS5zZXQoYGFwaToke2VuZHBvaW50LnBhdGh9YCwgZW5kcG9pbnQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX3Byb3h5LnByb3ZpZGVBcGkoYXBpKTtcblxuXHRcdFx0XHRcdFx0Ly8gTGV0J3MgY2FsbCB0aGUgbGlzdEFwaXMgbWV0aG9kIHRvIGNhY2hlIHRoZSBpbmZvIGZyb20gdGhlIGVuZHBvaW50c1xuXHRcdFx0XHRcdFx0Ly8gQWxzbywgc2luY2UgdGhpcyBpcyBhIHNpZGUtZWZmZWN0LCB3ZSBkbyBpdCBhc3luYyBzbyB3ZSBjYW4gcmV0dXJuIHRvIHRoZSBjYWxsZXJcblx0XHRcdFx0XHRcdHNlbmRlckZuKHsgbWV0aG9kOiAnYWNjZXNzb3I6YXBpOmxpc3RBcGlzJyB9KVxuXHRcdFx0XHRcdFx0XHQudGhlbigocmVzcG9uc2UpID0+IGFwaUVuZHBvaW50cy5wdXNoKC4uLihyZXNwb25zZS5yZXN1bHQgYXMgSUFwaUVuZHBvaW50TWV0YWRhdGFbXSkpKVxuXHRcdFx0XHRcdFx0XHQuY2F0Y2goKGVycikgPT4gZXJyLmVycm9yKTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzY2hlZHVsZXI6IHtcblx0XHRcdFx0XHRfcHJveHk6IHRoaXMucHJveGlmeSgnZ2V0Q29uZmlndXJhdGlvbkV4dGVuZDpzY2hlZHVsZXInKSxcblx0XHRcdFx0XHRyZWdpc3RlclByb2Nlc3NvcnMocHJvY2Vzc29yczogSVByb2Nlc3NvcltdKSB7XG5cdFx0XHRcdFx0XHQvLyBTdG9yZSB0aGUgcHJvY2Vzc29yIGluc3RhbmNlIHRvIHVzZSB3aGVuIHRoZSBBcHBzLUVuZ2luZSBjYWxscyB0aGUgcHJvY2Vzc29yXG5cdFx0XHRcdFx0XHRwcm9jZXNzb3JzLmZvckVhY2goKHByb2Nlc3NvcikgPT4ge1xuXHRcdFx0XHRcdFx0XHRBcHBPYmplY3RSZWdpc3RyeS5zZXQoYHNjaGVkdWxlcjoke3Byb2Nlc3Nvci5pZH1gLCBwcm9jZXNzb3IpO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLl9wcm94eS5yZWdpc3RlclByb2Nlc3NvcnMocHJvY2Vzc29ycyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0dmlkZW9Db25mUHJvdmlkZXJzOiB7XG5cdFx0XHRcdFx0X3Byb3h5OiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25FeHRlbmQ6dmlkZW9Db25mUHJvdmlkZXJzJyksXG5cdFx0XHRcdFx0cHJvdmlkZVZpZGVvQ29uZlByb3ZpZGVyKHByb3ZpZGVyOiBJVmlkZW9Db25mUHJvdmlkZXIpIHtcblx0XHRcdFx0XHRcdC8vIFN0b3JlIHRoZSB2aWRlb0NvbmZQcm92aWRlciBpbnN0YW5jZSB0byB1c2Ugd2hlbiB0aGUgQXBwcy1FbmdpbmUgY2FsbHMgdGhlIHZpZGVvQ29uZlByb3ZpZGVyXG5cdFx0XHRcdFx0XHRBcHBPYmplY3RSZWdpc3RyeS5zZXQoYHZpZGVvQ29uZlByb3ZpZGVyOiR7cHJvdmlkZXIubmFtZX1gLCBwcm92aWRlcik7XG5cblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLl9wcm94eS5wcm92aWRlVmlkZW9Db25mUHJvdmlkZXIocHJvdmlkZXIpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG91dGJvdW5kQ29tbXVuaWNhdGlvbjoge1xuXHRcdFx0XHRcdF9wcm94eTogdGhpcy5wcm94aWZ5KCdnZXRDb25maWd1cmF0aW9uRXh0ZW5kOm91dGJvdW5kQ29tbXVuaWNhdGlvbicpLFxuXHRcdFx0XHRcdHJlZ2lzdGVyRW1haWxQcm92aWRlcihwcm92aWRlcjogSU91dGJvdW5kRW1haWxNZXNzYWdlUHJvdmlkZXIpIHtcblx0XHRcdFx0XHRcdEFwcE9iamVjdFJlZ2lzdHJ5LnNldChgb3V0Ym91bmRDb21tdW5pY2F0aW9uOiR7cHJvdmlkZXIubmFtZX0tJHtwcm92aWRlci50eXBlfWAsIHByb3ZpZGVyKTtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLl9wcm94eS5yZWdpc3RlckVtYWlsUHJvdmlkZXIocHJvdmlkZXIpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cmVnaXN0ZXJQaG9uZVByb3ZpZGVyKHByb3ZpZGVyOiBJT3V0Ym91bmRQaG9uZU1lc3NhZ2VQcm92aWRlcikge1xuXHRcdFx0XHRcdFx0QXBwT2JqZWN0UmVnaXN0cnkuc2V0KGBvdXRib3VuZENvbW11bmljYXRpb246JHtwcm92aWRlci5uYW1lfS0ke3Byb3ZpZGVyLnR5cGV9YCwgcHJvdmlkZXIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3Byb3h5LnJlZ2lzdGVyUGhvbmVQcm92aWRlcihwcm92aWRlcik7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0c2xhc2hDb21tYW5kczoge1xuXHRcdFx0XHRcdF9wcm94eTogdGhpcy5wcm94aWZ5KCdnZXRDb25maWd1cmF0aW9uRXh0ZW5kOnNsYXNoQ29tbWFuZHMnKSxcblx0XHRcdFx0XHRwcm92aWRlU2xhc2hDb21tYW5kKHNsYXNoY29tbWFuZDogSVNsYXNoQ29tbWFuZCkge1xuXHRcdFx0XHRcdFx0Ly8gU3RvcmUgdGhlIHNsYXNoY29tbWFuZCBpbnN0YW5jZSB0byB1c2Ugd2hlbiB0aGUgQXBwcy1FbmdpbmUgY2FsbHMgdGhlIHNsYXNoY29tbWFuZFxuXHRcdFx0XHRcdFx0QXBwT2JqZWN0UmVnaXN0cnkuc2V0KGBzbGFzaGNvbW1hbmQ6JHtzbGFzaGNvbW1hbmQuY29tbWFuZH1gLCBzbGFzaGNvbW1hbmQpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fcHJveHkucHJvdmlkZVNsYXNoQ29tbWFuZChzbGFzaGNvbW1hbmQpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmNvbmZpZ0V4dGVuZGVyO1xuXHR9XG5cblx0cHVibGljIGdldERlZmF1bHRBcHBBY2Nlc3NvcnMoKSB7XG5cdFx0aWYgKCF0aGlzLmRlZmF1bHRBcHBBY2Nlc3NvcnMpIHtcblx0XHRcdHRoaXMuZGVmYXVsdEFwcEFjY2Vzc29ycyA9IHtcblx0XHRcdFx0ZW52aXJvbm1lbnRSZWFkZXI6IHRoaXMuZ2V0RW52aXJvbm1lbnRSZWFkKCksXG5cdFx0XHRcdGVudmlyb25tZW50V3JpdGVyOiB0aGlzLmdldEVudmlyb25tZW50V3JpdGUoKSxcblx0XHRcdFx0cmVhZGVyOiB0aGlzLmdldFJlYWRlcigpLFxuXHRcdFx0XHRodHRwOiB0aGlzLmdldEh0dHAoKSxcblx0XHRcdFx0cHJvdmlkZWRBcGlFbmRwb2ludHM6IEFwcE9iamVjdFJlZ2lzdHJ5LmdldDxJQXBpRW5kcG9pbnRNZXRhZGF0YVtdPignYXBpRW5kcG9pbnRzJykgYXMgSUFwaUVuZHBvaW50TWV0YWRhdGFbXSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuZGVmYXVsdEFwcEFjY2Vzc29ycztcblx0fVxuXG5cdHB1YmxpYyBnZXRSZWFkZXIoKSB7XG5cdFx0aWYgKCF0aGlzLnJlYWRlcikge1xuXHRcdFx0dGhpcy5yZWFkZXIgPSB7XG5cdFx0XHRcdGdldEVudmlyb25tZW50UmVhZGVyOiAoKSA9PiAoe1xuXHRcdFx0XHRcdGdldFNldHRpbmdzOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRFbnZpcm9ubWVudFJlYWRlcjpnZXRTZXR0aW5ncycpLFxuXHRcdFx0XHRcdGdldFNlcnZlclNldHRpbmdzOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRFbnZpcm9ubWVudFJlYWRlcjpnZXRTZXJ2ZXJTZXR0aW5ncycpLFxuXHRcdFx0XHRcdGdldEVudmlyb25tZW50VmFyaWFibGVzOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRFbnZpcm9ubWVudFJlYWRlcjpnZXRFbnZpcm9ubWVudFZhcmlhYmxlcycpLFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0Z2V0TWVzc2FnZVJlYWRlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRSZWFkZXI6Z2V0TWVzc2FnZVJlYWRlcicpLFxuXHRcdFx0XHRnZXRQZXJzaXN0ZW5jZVJlYWRlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRSZWFkZXI6Z2V0UGVyc2lzdGVuY2VSZWFkZXInKSxcblx0XHRcdFx0Z2V0Um9vbVJlYWRlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRSZWFkZXI6Z2V0Um9vbVJlYWRlcicpLFxuXHRcdFx0XHRnZXRVc2VyUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRVc2VyUmVhZGVyJyksXG5cdFx0XHRcdGdldE5vdGlmaWVyOiAoKSA9PiB0aGlzLmdldE5vdGlmaWVyKCksXG5cdFx0XHRcdGdldExpdmVjaGF0UmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRMaXZlY2hhdFJlYWRlcicpLFxuXHRcdFx0XHRnZXRVcGxvYWRSZWFkZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldFVwbG9hZFJlYWRlcicpLFxuXHRcdFx0XHRnZXRDbG91ZFdvcmtzcGFjZVJlYWRlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRSZWFkZXI6Z2V0Q2xvdWRXb3Jrc3BhY2VSZWFkZXInKSxcblx0XHRcdFx0Z2V0VmlkZW9Db25mZXJlbmNlUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRWaWRlb0NvbmZlcmVuY2VSZWFkZXInKSxcblx0XHRcdFx0Z2V0T0F1dGhBcHBzUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRPQXV0aEFwcHNSZWFkZXInKSxcblx0XHRcdFx0Z2V0VGhyZWFkUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRUaHJlYWRSZWFkZXInKSxcblx0XHRcdFx0Z2V0Um9sZVJlYWRlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRSZWFkZXI6Z2V0Um9sZVJlYWRlcicpLFxuXHRcdFx0XHRnZXRDb250YWN0UmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRDb250YWN0UmVhZGVyJyksXG5cdFx0XHRcdGdldEV4cGVyaW1lbnRhbFJlYWRlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRSZWFkZXI6Z2V0RXhwZXJpbWVudGFsUmVhZGVyJyksXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnJlYWRlcjtcblx0fVxuXG5cdHB1YmxpYyBnZXRNb2RpZmllcigpIHtcblx0XHRpZiAoIXRoaXMubW9kaWZpZXIpIHtcblx0XHRcdHRoaXMubW9kaWZpZXIgPSB7XG5cdFx0XHRcdGdldENyZWF0b3I6IHRoaXMuZ2V0Q3JlYXRvci5iaW5kKHRoaXMpLFxuXHRcdFx0XHRnZXRVcGRhdGVyOiB0aGlzLmdldFVwZGF0ZXIuYmluZCh0aGlzKSxcblx0XHRcdFx0Z2V0RXh0ZW5kZXI6IHRoaXMuZ2V0RXh0ZW5kZXIuYmluZCh0aGlzKSxcblx0XHRcdFx0Z2V0RGVsZXRlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRNb2RpZmllcjpnZXREZWxldGVyJyksXG5cdFx0XHRcdGdldE5vdGlmaWVyOiAoKSA9PiB0aGlzLmdldE5vdGlmaWVyKCksXG5cdFx0XHRcdGdldFVpQ29udHJvbGxlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRNb2RpZmllcjpnZXRVaUNvbnRyb2xsZXInKSxcblx0XHRcdFx0Z2V0U2NoZWR1bGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldE1vZGlmaWVyOmdldFNjaGVkdWxlcicpLFxuXHRcdFx0XHRnZXRPQXV0aEFwcHNNb2RpZmllcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRNb2RpZmllcjpnZXRPQXV0aEFwcHNNb2RpZmllcicpLFxuXHRcdFx0XHRnZXRNb2RlcmF0aW9uTW9kaWZpZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0TW9kaWZpZXI6Z2V0TW9kZXJhdGlvbk1vZGlmaWVyJyksXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm1vZGlmaWVyO1xuXHR9XG5cblx0cHVibGljIGdldFBlcnNpc3RlbmNlKCkge1xuXHRcdGlmICghdGhpcy5wZXJzaXN0ZW5jZSkge1xuXHRcdFx0dGhpcy5wZXJzaXN0ZW5jZSA9IHRoaXMucHJveGlmeSgnZ2V0UGVyc2lzdGVuY2UnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5wZXJzaXN0ZW5jZTtcblx0fVxuXG5cdHB1YmxpYyBnZXRIdHRwKCkge1xuXHRcdHJldHVybiB0aGlzLmh0dHA7XG5cdH1cblxuXHRwcml2YXRlIGdldENyZWF0b3IoKSB7XG5cdFx0aWYgKCF0aGlzLmNyZWF0b3IpIHtcblx0XHRcdHRoaXMuY3JlYXRvciA9IG5ldyBNb2RpZnlDcmVhdG9yKHRoaXMuc2VuZGVyRm4pO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmNyZWF0b3I7XG5cdH1cblxuXHRwcml2YXRlIGdldFVwZGF0ZXIoKSB7XG5cdFx0aWYgKCF0aGlzLnVwZGF0ZXIpIHtcblx0XHRcdHRoaXMudXBkYXRlciA9IG5ldyBNb2RpZnlVcGRhdGVyKHRoaXMuc2VuZGVyRm4pO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZXI7XG5cdH1cblxuXHRwcml2YXRlIGdldEV4dGVuZGVyKCkge1xuXHRcdGlmICghdGhpcy5leHRlbmRlcikge1xuXHRcdFx0dGhpcy5leHRlbmRlciA9IG5ldyBNb2RpZnlFeHRlbmRlcih0aGlzLnNlbmRlckZuKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5leHRlbmRlcjtcblx0fVxuXG5cdHByaXZhdGUgZ2V0Tm90aWZpZXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMubm90aWZpZXI7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IEFwcEFjY2Vzc29yc0luc3RhbmNlID0gbmV3IEFwcEFjY2Vzc29ycyhNZXNzZW5nZXIuc2VuZFJlcXVlc3QpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQW9CQSxTQUFTLElBQUksUUFBUSxZQUFZO0FBQ2pDLFNBQVMsVUFBVSxRQUFRLDhCQUE4QjtBQUN6RCxZQUFZLGVBQWUsa0JBQWtCO0FBQzdDLFNBQVMsaUJBQWlCLFFBQVEsNkJBQTZCO0FBQy9ELFNBQVMsYUFBYSxRQUFRLDRCQUE0QjtBQUMxRCxTQUFTLGFBQWEsUUFBUSw0QkFBNEI7QUFDMUQsU0FBUyxjQUFjLFFBQVEsNkJBQTZCO0FBQzVELFNBQVMsUUFBUSxRQUFRLGdCQUFnQjtBQUN6QyxTQUFTLG1CQUFtQixRQUFRLGtDQUFrQztBQUV0RSxNQUFNLGNBQWM7RUFBQztFQUFPO0VBQVE7RUFBTztFQUFVO0VBQVE7RUFBVztDQUFRO0FBRWhGLHVGQUF1RjtBQUN2RixJQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxpQkFBaUI7RUFDM0Msa0JBQWtCLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRTtBQUN6QztBQUVBLE9BQU8sTUFBTTs7RUFDSixvQkFBb0M7RUFDcEMsZ0JBQW1DO0VBQ25DLGtCQUFzQztFQUN0QyxlQUFzQztFQUN0QyxlQUFzQztFQUN0QyxPQUFlO0VBQ2YsU0FBbUI7RUFDbkIsWUFBMkI7RUFDM0IsUUFBd0I7RUFDeEIsUUFBd0I7RUFDeEIsU0FBMEI7RUFDMUIsV0FBMkM7RUFDM0MsS0FBYTtFQUNiLFNBQXFCO0VBRXJCLFFBQWtHO0VBRTFHLFlBQVksQUFBaUIsUUFBc0MsQ0FBRTtTQUF4QyxXQUFBO1NBTnJCLGFBQTBCLElBQUk7SUFPckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFJLFdBQW1CLFlBQTZELENBQUMsQ0FBQyxHQUNwRyxJQUFJLE1BQ0g7UUFBRSxRQUFRLENBQUMsU0FBUyxFQUFFLFdBQVc7TUFBQyxHQUNsQztRQUNDLEtBQ0MsQ0FBQyxTQUFrQixPQUNuQixDQUFDLEdBQUc7WUFDSCxnREFBZ0Q7WUFDaEQsSUFBSSxTQUFTLFVBQVU7Y0FDdEIsT0FBTyxDQUFDO1lBQ1Q7WUFFQSx1REFBdUQ7WUFDdkQsSUFBSSxRQUFRLFdBQVc7Y0FDdEIsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXO1lBQ3pDO1lBRUEsT0FBTyxTQUFTO2NBQ2YsUUFBUSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsRUFBRSxNQUFNO2NBQ3ZDO1lBQ0QsR0FDRSxJQUFJLENBQUMsQ0FBQyxXQUFhLFNBQVMsTUFBTSxFQUNsQyxLQUFLLENBQUMsQ0FBQztjQUNQLE1BQU0sb0JBQW9CO1lBQzNCO1VBQ0Y7TUFDRjtJQUdGLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXO0lBQy9GLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxTQUFTLElBQUksQ0FBQyxXQUFXO0VBQzlDO0VBRU8sY0FBYztJQUNwQixPQUFPLElBQUksQ0FBQyxRQUFRO0VBQ3JCO0VBRU8scUJBQXVDO0lBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO01BQzFCLElBQUksQ0FBQyxlQUFlLEdBQUc7UUFDdEIsYUFBYSxJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDaEMsbUJBQW1CLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN0Qyx5QkFBeUIsSUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDO01BQzdDO0lBQ0Q7SUFFQSxPQUFPLElBQUksQ0FBQyxlQUFlO0VBQzVCO0VBRU8sc0JBQXNCO0lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7TUFDNUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHO1FBQ3hCLGFBQWEsSUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ2hDLG1CQUFtQixJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7TUFDdkM7SUFDRDtJQUVBLE9BQU8sSUFBSSxDQUFDLGlCQUFpQjtFQUM5QjtFQUVPLHlCQUF5QjtJQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtNQUN6QixJQUFJLENBQUMsY0FBYyxHQUFHO1FBQ3JCLFdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QixlQUFlO1VBQ2QsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDO1VBQ3JCLG9CQUFtQixZQUEyQjtZQUM3QyxxRkFBcUY7WUFDckYsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLGFBQWEsRUFBRSxhQUFhLE9BQU8sRUFBRSxFQUFFO1lBRTlELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztVQUN2QztVQUNBLHFCQUFvQixPQUFlO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztVQUN4QztVQUNBLG9CQUFtQixPQUFlO1lBQ2pDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztVQUN2QztRQUNEO1FBQ0EsZ0JBQWdCLElBQUksQ0FBQyxPQUFPLENBQUM7TUFDOUI7SUFDRDtJQUVBLE9BQU8sSUFBSSxDQUFDLGNBQWM7RUFDM0I7RUFFTyx5QkFBeUI7SUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7TUFDekIsTUFBTSxXQUFXLElBQUksQ0FBQyxRQUFRO01BRTlCLElBQUksQ0FBQyxjQUFjLEdBQUc7UUFDckIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ2pCLE1BQU0sSUFBSSxDQUFDLFVBQVU7UUFDckIsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLG9CQUFvQixJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ2pDLEtBQUs7VUFDSixRQUFRLElBQUksQ0FBQyxPQUFPLENBQUM7VUFDckIsTUFBTSxZQUFXLEdBQVM7WUFDekIsTUFBTSxlQUFlLGtCQUFrQixHQUFHLENBQXlCO1lBRW5FLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2NBQ3RCLFNBQVMsaUJBQWlCLEdBQUcsWUFBWSxNQUFNLENBQUMsQ0FBQyxTQUFXLE9BQU8sUUFBUSxDQUFDLE9BQU8sS0FBSztjQUV4Rix1RkFBdUY7Y0FDdkYsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLElBQUksRUFBRSxFQUFFO1lBQy9DO1lBRUEsTUFBTSxTQUFTLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFFNUMsc0VBQXNFO1lBQ3RFLG1GQUFtRjtZQUNuRixTQUFTO2NBQUUsUUFBUTtZQUF3QixHQUN6QyxJQUFJLENBQUMsQ0FBQyxXQUFhLGFBQWEsSUFBSSxJQUFLLFNBQVMsTUFBTSxHQUN4RCxLQUFLLENBQUMsQ0FBQyxNQUFRLElBQUksS0FBSztZQUUxQixPQUFPO1VBQ1I7UUFDRDtRQUNBLFdBQVc7VUFDVixRQUFRLElBQUksQ0FBQyxPQUFPLENBQUM7VUFDckIsb0JBQW1CLFVBQXdCO1lBQzFDLCtFQUErRTtZQUMvRSxXQUFXLE9BQU8sQ0FBQyxDQUFDO2NBQ25CLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTtZQUNwRDtZQUVBLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztVQUN2QztRQUNEO1FBQ0Esb0JBQW9CO1VBQ25CLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQztVQUNyQiwwQkFBeUIsUUFBNEI7WUFDcEQsK0ZBQStGO1lBQy9GLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLElBQUksRUFBRSxFQUFFO1lBRTVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQztVQUM3QztRQUNEO1FBQ0EsdUJBQXVCO1VBQ3RCLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQztVQUNyQix1QkFBc0IsUUFBdUM7WUFDNUQsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRSxTQUFTLElBQUksRUFBRSxFQUFFO1lBQ2pGLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQztVQUMxQztVQUNBLHVCQUFzQixRQUF1QztZQUM1RCxrQkFBa0IsR0FBRyxDQUFDLENBQUMsc0JBQXNCLEVBQUUsU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLFNBQVMsSUFBSSxFQUFFLEVBQUU7WUFDakYsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUFDO1VBQzFDO1FBQ0Q7UUFDQSxlQUFlO1VBQ2QsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDO1VBQ3JCLHFCQUFvQixZQUEyQjtZQUM5QyxxRkFBcUY7WUFDckYsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLGFBQWEsRUFBRSxhQUFhLE9BQU8sRUFBRSxFQUFFO1lBRTlELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztVQUN4QztRQUNEO01BQ0Q7SUFDRDtJQUVBLE9BQU8sSUFBSSxDQUFDLGNBQWM7RUFDM0I7RUFFTyx5QkFBeUI7SUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtNQUM5QixJQUFJLENBQUMsbUJBQW1CLEdBQUc7UUFDMUIsbUJBQW1CLElBQUksQ0FBQyxrQkFBa0I7UUFDMUMsbUJBQW1CLElBQUksQ0FBQyxtQkFBbUI7UUFDM0MsUUFBUSxJQUFJLENBQUMsU0FBUztRQUN0QixNQUFNLElBQUksQ0FBQyxPQUFPO1FBQ2xCLHNCQUFzQixrQkFBa0IsR0FBRyxDQUF5QjtNQUNyRTtJQUNEO0lBRUEsT0FBTyxJQUFJLENBQUMsbUJBQW1CO0VBQ2hDO0VBRU8sWUFBWTtJQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtNQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHO1FBQ2Isc0JBQXNCLElBQU0sQ0FBQztZQUM1QixhQUFhLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNoQyxtQkFBbUIsSUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3RDLHlCQUF5QixJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7VUFDN0MsQ0FBQztRQUNELGtCQUFrQixJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckMsc0JBQXNCLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN6QyxlQUFlLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNsQyxlQUFlLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNsQyxhQUFhLElBQU0sSUFBSSxDQUFDLFdBQVc7UUFDbkMsbUJBQW1CLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN0QyxpQkFBaUIsSUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3BDLHlCQUF5QixJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDNUMsMEJBQTBCLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUM3QyxvQkFBb0IsSUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3ZDLGlCQUFpQixJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDcEMsZUFBZSxJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDbEMsa0JBQWtCLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQyx1QkFBdUIsSUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDO01BQzNDO0lBQ0Q7SUFFQSxPQUFPLElBQUksQ0FBQyxNQUFNO0VBQ25CO0VBRU8sY0FBYztJQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtNQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHO1FBQ2YsWUFBWSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJO1FBQ3JDLFlBQVksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSTtRQUNyQyxhQUFhLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUk7UUFDdkMsWUFBWSxJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDL0IsYUFBYSxJQUFNLElBQUksQ0FBQyxXQUFXO1FBQ25DLGlCQUFpQixJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDcEMsY0FBYyxJQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDakMsc0JBQXNCLElBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN6Qyx1QkFBdUIsSUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDO01BQzNDO0lBQ0Q7SUFFQSxPQUFPLElBQUksQ0FBQyxRQUFRO0VBQ3JCO0VBRU8saUJBQWlCO0lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO01BQ3RCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUNqQztJQUVBLE9BQU8sSUFBSSxDQUFDLFdBQVc7RUFDeEI7RUFFTyxVQUFVO0lBQ2hCLE9BQU8sSUFBSSxDQUFDLElBQUk7RUFDakI7RUFFUSxhQUFhO0lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO01BQ2xCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxjQUFjLElBQUksQ0FBQyxRQUFRO0lBQy9DO0lBRUEsT0FBTyxJQUFJLENBQUMsT0FBTztFQUNwQjtFQUVRLGFBQWE7SUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7TUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLGNBQWMsSUFBSSxDQUFDLFFBQVE7SUFDL0M7SUFFQSxPQUFPLElBQUksQ0FBQyxPQUFPO0VBQ3BCO0VBRVEsY0FBYztJQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtNQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksZUFBZSxJQUFJLENBQUMsUUFBUTtJQUNqRDtJQUVBLE9BQU8sSUFBSSxDQUFDLFFBQVE7RUFDckI7RUFFUSxjQUFjO0lBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVE7RUFDckI7QUFDRDtBQUVBLE9BQU8sTUFBTSx1QkFBdUIsSUFBSSxhQUFhLFVBQVUsV0FBVyxFQUFFIn0=
// denoCacheMetadata=7948029172087017521,2356495993127763167