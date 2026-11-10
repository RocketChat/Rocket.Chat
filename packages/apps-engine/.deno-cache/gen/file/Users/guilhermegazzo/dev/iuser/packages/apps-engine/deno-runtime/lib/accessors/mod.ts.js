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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L2l1c2VyL3BhY2thZ2VzL2FwcHMtZW5naW5lL2Rlbm8tcnVudGltZS9saWIvYWNjZXNzb3JzL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElBcHBBY2Nlc3NvcnMgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSUFwcEFjY2Vzc29ycy50cyc7XG5pbXBvcnQgdHlwZSB7IElBcGlFbmRwb2ludE1ldGFkYXRhIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYXBpL0lBcGlFbmRwb2ludE1ldGFkYXRhLnRzJztcbmltcG9ydCB0eXBlIHsgSUVudmlyb25tZW50V3JpdGUgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSUVudmlyb25tZW50V3JpdGUudHMnO1xuaW1wb3J0IHR5cGUgeyBJRW52aXJvbm1lbnRSZWFkIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lFbnZpcm9ubWVudFJlYWQudHMnO1xuaW1wb3J0IHR5cGUgeyBJQ29uZmlndXJhdGlvbk1vZGlmeSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JQ29uZmlndXJhdGlvbk1vZGlmeS50cyc7XG5pbXBvcnQgdHlwZSB7IElSZWFkIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lSZWFkLnRzJztcbmltcG9ydCB0eXBlIHsgSU1vZGlmeSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JTW9kaWZ5LnRzJztcbmltcG9ydCB0eXBlIHsgSU5vdGlmaWVyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYWNjZXNzb3JzL0lOb3RpZmllci50cyc7XG5pbXBvcnQgdHlwZSB7IElQZXJzaXN0ZW5jZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JUGVyc2lzdGVuY2UudHMnO1xuaW1wb3J0IHR5cGUgeyBJSHR0cCwgSUh0dHBFeHRlbmQgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9hY2Nlc3NvcnMvSUh0dHAudHMnO1xuaW1wb3J0IHR5cGUgeyBJQ29uZmlndXJhdGlvbkV4dGVuZCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9kZWZpbml0aW9uL2FjY2Vzc29ycy9JQ29uZmlndXJhdGlvbkV4dGVuZC50cyc7XG5pbXBvcnQgdHlwZSB7IElTbGFzaENvbW1hbmQgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9zbGFzaGNvbW1hbmRzL0lTbGFzaENvbW1hbmQudHMnO1xuaW1wb3J0IHR5cGUgeyBJUHJvY2Vzc29yIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vc2NoZWR1bGVyL0lQcm9jZXNzb3IudHMnO1xuaW1wb3J0IHR5cGUgeyBJQXBpIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL2RlZmluaXRpb24vYXBpL0lBcGkudHMnO1xuaW1wb3J0IHR5cGUgeyBJVmlkZW9Db25mUHJvdmlkZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi92aWRlb0NvbmZQcm92aWRlcnMvSVZpZGVvQ29uZlByb3ZpZGVyLnRzJztcbmltcG9ydCB0eXBlIHtcblx0SU91dGJvdW5kUGhvbmVNZXNzYWdlUHJvdmlkZXIsXG5cdElPdXRib3VuZEVtYWlsTWVzc2FnZVByb3ZpZGVyLFxufSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvZGVmaW5pdGlvbi9vdXRib3VuZENvbW11bmljYXRpb24vSU91dGJvdW5kQ29tbXNQcm92aWRlci50cyc7XG5cbmltcG9ydCB7IEh0dHAgfSBmcm9tICcuL2h0dHAudHMnO1xuaW1wb3J0IHsgSHR0cEV4dGVuZCB9IGZyb20gJy4vZXh0ZW5kZXJzL0h0dHBFeHRlbmRlci50cyc7XG5pbXBvcnQgKiBhcyBNZXNzZW5nZXIgZnJvbSAnLi4vbWVzc2VuZ2VyLnRzJztcbmltcG9ydCB7IEFwcE9iamVjdFJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vQXBwT2JqZWN0UmVnaXN0cnkudHMnO1xuaW1wb3J0IHsgTW9kaWZ5Q3JlYXRvciB9IGZyb20gJy4vbW9kaWZ5L01vZGlmeUNyZWF0b3IudHMnO1xuaW1wb3J0IHsgTW9kaWZ5VXBkYXRlciB9IGZyb20gJy4vbW9kaWZ5L01vZGlmeVVwZGF0ZXIudHMnO1xuaW1wb3J0IHsgTW9kaWZ5RXh0ZW5kZXIgfSBmcm9tICcuL21vZGlmeS9Nb2RpZnlFeHRlbmRlci50cyc7XG5pbXBvcnQgeyBOb3RpZmllciB9IGZyb20gJy4vbm90aWZpZXIudHMnO1xuaW1wb3J0IHsgZm9ybWF0RXJyb3JSZXNwb25zZSB9IGZyb20gJy4vZm9ybWF0UmVzcG9uc2VFcnJvckhhbmRsZXIudHMnO1xuXG5jb25zdCBodHRwTWV0aG9kcyA9IFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ2RlbGV0ZScsICdoZWFkJywgJ29wdGlvbnMnLCAncGF0Y2gnXSBhcyBjb25zdDtcblxuLy8gV2UgbmVlZCB0byBjcmVhdGUgdGhpcyBvYmplY3QgZmlyc3QgdGhpbmcsIGFzIHdlJ2xsIGhhbmRsZSByZWZlcmVuY2VzIHRvIGl0IGxhdGVyIG9uXG5pZiAoIUFwcE9iamVjdFJlZ2lzdHJ5LmhhcygnYXBpRW5kcG9pbnRzJykpIHtcblx0QXBwT2JqZWN0UmVnaXN0cnkuc2V0KCdhcGlFbmRwb2ludHMnLCBbXSk7XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBBY2Nlc3NvcnMge1xuXHRwcml2YXRlIGRlZmF1bHRBcHBBY2Nlc3NvcnM/OiBJQXBwQWNjZXNzb3JzO1xuXHRwcml2YXRlIGVudmlyb25tZW50UmVhZD86IElFbnZpcm9ubWVudFJlYWQ7XG5cdHByaXZhdGUgZW52aXJvbm1lbnRXcml0ZXI/OiBJRW52aXJvbm1lbnRXcml0ZTtcblx0cHJpdmF0ZSBjb25maWdNb2RpZmllcj86IElDb25maWd1cmF0aW9uTW9kaWZ5O1xuXHRwcml2YXRlIGNvbmZpZ0V4dGVuZGVyPzogSUNvbmZpZ3VyYXRpb25FeHRlbmQ7XG5cdHByaXZhdGUgcmVhZGVyPzogSVJlYWQ7XG5cdHByaXZhdGUgbW9kaWZpZXI/OiBJTW9kaWZ5O1xuXHRwcml2YXRlIHBlcnNpc3RlbmNlPzogSVBlcnNpc3RlbmNlO1xuXHRwcml2YXRlIGNyZWF0b3I/OiBNb2RpZnlDcmVhdG9yO1xuXHRwcml2YXRlIHVwZGF0ZXI/OiBNb2RpZnlVcGRhdGVyO1xuXHRwcml2YXRlIGV4dGVuZGVyPzogTW9kaWZ5RXh0ZW5kZXI7XG5cdHByaXZhdGUgaHR0cEV4dGVuZDogSUh0dHBFeHRlbmQgPSBuZXcgSHR0cEV4dGVuZCgpO1xuXHRwcml2YXRlIGh0dHA/OiBJSHR0cDtcblx0cHJpdmF0ZSBub3RpZmllcj86IElOb3RpZmllcjtcblxuXHRwcml2YXRlIHByb3hpZnk6IDxUPihuYW1lc3BhY2U6IHN0cmluZywgb3ZlcnJpZGVzPzogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdW5rbm93bj4pID0+IFQ7XG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBzZW5kZXJGbjogdHlwZW9mIE1lc3Nlbmdlci5zZW5kUmVxdWVzdCkge1xuXHRcdHRoaXMucHJveGlmeSA9IDxUPihuYW1lc3BhY2U6IHN0cmluZywgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3duPiA9IHt9KTogVCA9PlxuXHRcdFx0bmV3IFByb3h5KFxuXHRcdFx0XHR7IF9fa2luZDogYGFjY2Vzc29yOiR7bmFtZXNwYWNlfWAgfSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGdldDpcblx0XHRcdFx0XHRcdChfdGFyZ2V0OiB1bmtub3duLCBwcm9wOiBzdHJpbmcpID0+XG5cdFx0XHRcdFx0XHQoLi4ucGFyYW1zOiB1bmtub3duW10pID0+IHtcblx0XHRcdFx0XHRcdFx0Ly8gV2UgZG9uJ3Qgd2FudCB0byBzZW5kIGEgcmVxdWVzdCBmb3IgdGhpcyBwcm9wXG5cdFx0XHRcdFx0XHRcdGlmIChwcm9wID09PSAndG9KU09OJykge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiB7fTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vIElmIHRoZSBwcm9wIGlzIGludGVkZWQgdG8gYmUgb3ZlcnJpZGVuIGJ5IHRoZSBjYWxsZXJcblx0XHRcdFx0XHRcdFx0aWYgKHByb3AgaW4gb3ZlcnJpZGVzKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG92ZXJyaWRlc1twcm9wXS5hcHBseSh1bmRlZmluZWQsIHBhcmFtcyk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gc2VuZGVyRm4oe1xuXHRcdFx0XHRcdFx0XHRcdG1ldGhvZDogYGFjY2Vzc29yOiR7bmFtZXNwYWNlfToke3Byb3B9YCxcblx0XHRcdFx0XHRcdFx0XHRwYXJhbXMsXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5yZXN1bHQpXG5cdFx0XHRcdFx0XHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdHRocm93IGZvcm1hdEVycm9yUmVzcG9uc2UoZXJyKTtcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHQpIGFzIFQ7XG5cblx0XHR0aGlzLmh0dHAgPSBuZXcgSHR0cCh0aGlzLmdldFJlYWRlcigpLCB0aGlzLmdldFBlcnNpc3RlbmNlKCksIHRoaXMuaHR0cEV4dGVuZCwgdGhpcy5nZXRTZW5kZXJGbigpKTtcblx0XHR0aGlzLm5vdGlmaWVyID0gbmV3IE5vdGlmaWVyKHRoaXMuZ2V0U2VuZGVyRm4oKSk7XG5cdH1cblxuXHRwdWJsaWMgZ2V0U2VuZGVyRm4oKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZGVyRm47XG5cdH1cblxuXHRwdWJsaWMgZ2V0RW52aXJvbm1lbnRSZWFkKCk6IElFbnZpcm9ubWVudFJlYWQge1xuXHRcdGlmICghdGhpcy5lbnZpcm9ubWVudFJlYWQpIHtcblx0XHRcdHRoaXMuZW52aXJvbm1lbnRSZWFkID0ge1xuXHRcdFx0XHRnZXRTZXR0aW5nczogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRFbnZpcm9ubWVudFJlYWQ6Z2V0U2V0dGluZ3MnKSxcblx0XHRcdFx0Z2V0U2VydmVyU2V0dGluZ3M6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0RW52aXJvbm1lbnRSZWFkOmdldFNlcnZlclNldHRpbmdzJyksXG5cdFx0XHRcdGdldEVudmlyb25tZW50VmFyaWFibGVzOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldEVudmlyb25tZW50UmVhZDpnZXRFbnZpcm9ubWVudFZhcmlhYmxlcycpLFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5lbnZpcm9ubWVudFJlYWQ7XG5cdH1cblxuXHRwdWJsaWMgZ2V0RW52aXJvbm1lbnRXcml0ZSgpIHtcblx0XHRpZiAoIXRoaXMuZW52aXJvbm1lbnRXcml0ZXIpIHtcblx0XHRcdHRoaXMuZW52aXJvbm1lbnRXcml0ZXIgPSB7XG5cdFx0XHRcdGdldFNldHRpbmdzOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldEVudmlyb25tZW50V3JpdGU6Z2V0U2V0dGluZ3MnKSxcblx0XHRcdFx0Z2V0U2VydmVyU2V0dGluZ3M6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0RW52aXJvbm1lbnRXcml0ZTpnZXRTZXJ2ZXJTZXR0aW5ncycpLFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5lbnZpcm9ubWVudFdyaXRlcjtcblx0fVxuXG5cdHB1YmxpYyBnZXRDb25maWd1cmF0aW9uTW9kaWZ5KCkge1xuXHRcdGlmICghdGhpcy5jb25maWdNb2RpZmllcikge1xuXHRcdFx0dGhpcy5jb25maWdNb2RpZmllciA9IHtcblx0XHRcdFx0c2NoZWR1bGVyOiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25Nb2RpZnk6c2NoZWR1bGVyJyksXG5cdFx0XHRcdHNsYXNoQ29tbWFuZHM6IHtcblx0XHRcdFx0XHRfcHJveHk6IHRoaXMucHJveGlmeSgnZ2V0Q29uZmlndXJhdGlvbk1vZGlmeTpzbGFzaENvbW1hbmRzJyksXG5cdFx0XHRcdFx0bW9kaWZ5U2xhc2hDb21tYW5kKHNsYXNoY29tbWFuZDogSVNsYXNoQ29tbWFuZCkge1xuXHRcdFx0XHRcdFx0Ly8gU3RvcmUgdGhlIHNsYXNoY29tbWFuZCBpbnN0YW5jZSB0byB1c2Ugd2hlbiB0aGUgQXBwcy1FbmdpbmUgY2FsbHMgdGhlIHNsYXNoY29tbWFuZFxuXHRcdFx0XHRcdFx0QXBwT2JqZWN0UmVnaXN0cnkuc2V0KGBzbGFzaGNvbW1hbmQ6JHtzbGFzaGNvbW1hbmQuY29tbWFuZH1gLCBzbGFzaGNvbW1hbmQpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fcHJveHkubW9kaWZ5U2xhc2hDb21tYW5kKHNsYXNoY29tbWFuZCk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRkaXNhYmxlU2xhc2hDb21tYW5kKGNvbW1hbmQ6IHN0cmluZykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3Byb3h5LmRpc2FibGVTbGFzaENvbW1hbmQoY29tbWFuZCk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRlbmFibGVTbGFzaENvbW1hbmQoY29tbWFuZDogc3RyaW5nKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fcHJveHkuZW5hYmxlU2xhc2hDb21tYW5kKGNvbW1hbmQpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNlcnZlclNldHRpbmdzOiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25Nb2RpZnk6c2VydmVyU2V0dGluZ3MnKSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuY29uZmlnTW9kaWZpZXI7XG5cdH1cblxuXHRwdWJsaWMgZ2V0Q29uZmlndXJhdGlvbkV4dGVuZCgpIHtcblx0XHRpZiAoIXRoaXMuY29uZmlnRXh0ZW5kZXIpIHtcblx0XHRcdGNvbnN0IHNlbmRlckZuID0gdGhpcy5zZW5kZXJGbjtcblxuXHRcdFx0dGhpcy5jb25maWdFeHRlbmRlciA9IHtcblx0XHRcdFx0dWk6IHRoaXMucHJveGlmeSgnZ2V0Q29uZmlndXJhdGlvbkV4dGVuZDp1aScpLFxuXHRcdFx0XHRodHRwOiB0aGlzLmh0dHBFeHRlbmQsXG5cdFx0XHRcdHNldHRpbmdzOiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25FeHRlbmQ6c2V0dGluZ3MnKSxcblx0XHRcdFx0ZXh0ZXJuYWxDb21wb25lbnRzOiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25FeHRlbmQ6ZXh0ZXJuYWxDb21wb25lbnRzJyksXG5cdFx0XHRcdGFwaToge1xuXHRcdFx0XHRcdF9wcm94eTogdGhpcy5wcm94aWZ5KCdnZXRDb25maWd1cmF0aW9uRXh0ZW5kOmFwaScpLFxuXHRcdFx0XHRcdGFzeW5jIHByb3ZpZGVBcGkoYXBpOiBJQXBpKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBhcGlFbmRwb2ludHMgPSBBcHBPYmplY3RSZWdpc3RyeS5nZXQ8SUFwaUVuZHBvaW50TWV0YWRhdGFbXT4oJ2FwaUVuZHBvaW50cycpITtcblxuXHRcdFx0XHRcdFx0YXBpLmVuZHBvaW50cy5mb3JFYWNoKChlbmRwb2ludCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRlbmRwb2ludC5fYXZhaWxhYmxlTWV0aG9kcyA9IGh0dHBNZXRob2RzLmZpbHRlcigobWV0aG9kKSA9PiB0eXBlb2YgZW5kcG9pbnRbbWV0aG9kXSA9PT0gJ2Z1bmN0aW9uJyk7XG5cblx0XHRcdFx0XHRcdFx0Ly8gV2UgbmVlZCB0byBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBlbmRwb2ludCBhcm91bmQgZm9yIHVzIHRvIGNhbGwgdGhlIGV4ZWN1dG9yIGxhdGVyXG5cdFx0XHRcdFx0XHRcdEFwcE9iamVjdFJlZ2lzdHJ5LnNldChgYXBpOiR7ZW5kcG9pbnQucGF0aH1gLCBlbmRwb2ludCk7XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5fcHJveHkucHJvdmlkZUFwaShhcGkpO1xuXG5cdFx0XHRcdFx0XHQvLyBMZXQncyBjYWxsIHRoZSBsaXN0QXBpcyBtZXRob2QgdG8gY2FjaGUgdGhlIGluZm8gZnJvbSB0aGUgZW5kcG9pbnRzXG5cdFx0XHRcdFx0XHQvLyBBbHNvLCBzaW5jZSB0aGlzIGlzIGEgc2lkZS1lZmZlY3QsIHdlIGRvIGl0IGFzeW5jIHNvIHdlIGNhbiByZXR1cm4gdG8gdGhlIGNhbGxlclxuXHRcdFx0XHRcdFx0c2VuZGVyRm4oeyBtZXRob2Q6ICdhY2Nlc3NvcjphcGk6bGlzdEFwaXMnIH0pXG5cdFx0XHRcdFx0XHRcdC50aGVuKChyZXNwb25zZSkgPT4gYXBpRW5kcG9pbnRzLnB1c2goLi4uKHJlc3BvbnNlLnJlc3VsdCBhcyBJQXBpRW5kcG9pbnRNZXRhZGF0YVtdKSkpXG5cdFx0XHRcdFx0XHRcdC5jYXRjaCgoZXJyKSA9PiBlcnIuZXJyb3IpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNjaGVkdWxlcjoge1xuXHRcdFx0XHRcdF9wcm94eTogdGhpcy5wcm94aWZ5KCdnZXRDb25maWd1cmF0aW9uRXh0ZW5kOnNjaGVkdWxlcicpLFxuXHRcdFx0XHRcdHJlZ2lzdGVyUHJvY2Vzc29ycyhwcm9jZXNzb3JzOiBJUHJvY2Vzc29yW10pIHtcblx0XHRcdFx0XHRcdC8vIFN0b3JlIHRoZSBwcm9jZXNzb3IgaW5zdGFuY2UgdG8gdXNlIHdoZW4gdGhlIEFwcHMtRW5naW5lIGNhbGxzIHRoZSBwcm9jZXNzb3Jcblx0XHRcdFx0XHRcdHByb2Nlc3NvcnMuZm9yRWFjaCgocHJvY2Vzc29yKSA9PiB7XG5cdFx0XHRcdFx0XHRcdEFwcE9iamVjdFJlZ2lzdHJ5LnNldChgc2NoZWR1bGVyOiR7cHJvY2Vzc29yLmlkfWAsIHByb2Nlc3Nvcik7XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3Byb3h5LnJlZ2lzdGVyUHJvY2Vzc29ycyhwcm9jZXNzb3JzKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR2aWRlb0NvbmZQcm92aWRlcnM6IHtcblx0XHRcdFx0XHRfcHJveHk6IHRoaXMucHJveGlmeSgnZ2V0Q29uZmlndXJhdGlvbkV4dGVuZDp2aWRlb0NvbmZQcm92aWRlcnMnKSxcblx0XHRcdFx0XHRwcm92aWRlVmlkZW9Db25mUHJvdmlkZXIocHJvdmlkZXI6IElWaWRlb0NvbmZQcm92aWRlcikge1xuXHRcdFx0XHRcdFx0Ly8gU3RvcmUgdGhlIHZpZGVvQ29uZlByb3ZpZGVyIGluc3RhbmNlIHRvIHVzZSB3aGVuIHRoZSBBcHBzLUVuZ2luZSBjYWxscyB0aGUgdmlkZW9Db25mUHJvdmlkZXJcblx0XHRcdFx0XHRcdEFwcE9iamVjdFJlZ2lzdHJ5LnNldChgdmlkZW9Db25mUHJvdmlkZXI6JHtwcm92aWRlci5uYW1lfWAsIHByb3ZpZGVyKTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3Byb3h5LnByb3ZpZGVWaWRlb0NvbmZQcm92aWRlcihwcm92aWRlcik7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0b3V0Ym91bmRDb21tdW5pY2F0aW9uOiB7XG5cdFx0XHRcdFx0X3Byb3h5OiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25FeHRlbmQ6b3V0Ym91bmRDb21tdW5pY2F0aW9uJyksXG5cdFx0XHRcdFx0cmVnaXN0ZXJFbWFpbFByb3ZpZGVyKHByb3ZpZGVyOiBJT3V0Ym91bmRFbWFpbE1lc3NhZ2VQcm92aWRlcikge1xuXHRcdFx0XHRcdFx0QXBwT2JqZWN0UmVnaXN0cnkuc2V0KGBvdXRib3VuZENvbW11bmljYXRpb246JHtwcm92aWRlci5uYW1lfS0ke3Byb3ZpZGVyLnR5cGV9YCwgcHJvdmlkZXIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3Byb3h5LnJlZ2lzdGVyRW1haWxQcm92aWRlcihwcm92aWRlcik7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRyZWdpc3RlclBob25lUHJvdmlkZXIocHJvdmlkZXI6IElPdXRib3VuZFBob25lTWVzc2FnZVByb3ZpZGVyKSB7XG5cdFx0XHRcdFx0XHRBcHBPYmplY3RSZWdpc3RyeS5zZXQoYG91dGJvdW5kQ29tbXVuaWNhdGlvbjoke3Byb3ZpZGVyLm5hbWV9LSR7cHJvdmlkZXIudHlwZX1gLCBwcm92aWRlcik7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fcHJveHkucmVnaXN0ZXJQaG9uZVByb3ZpZGVyKHByb3ZpZGVyKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzbGFzaENvbW1hbmRzOiB7XG5cdFx0XHRcdFx0X3Byb3h5OiB0aGlzLnByb3hpZnkoJ2dldENvbmZpZ3VyYXRpb25FeHRlbmQ6c2xhc2hDb21tYW5kcycpLFxuXHRcdFx0XHRcdHByb3ZpZGVTbGFzaENvbW1hbmQoc2xhc2hjb21tYW5kOiBJU2xhc2hDb21tYW5kKSB7XG5cdFx0XHRcdFx0XHQvLyBTdG9yZSB0aGUgc2xhc2hjb21tYW5kIGluc3RhbmNlIHRvIHVzZSB3aGVuIHRoZSBBcHBzLUVuZ2luZSBjYWxscyB0aGUgc2xhc2hjb21tYW5kXG5cdFx0XHRcdFx0XHRBcHBPYmplY3RSZWdpc3RyeS5zZXQoYHNsYXNoY29tbWFuZDoke3NsYXNoY29tbWFuZC5jb21tYW5kfWAsIHNsYXNoY29tbWFuZCk7XG5cblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLl9wcm94eS5wcm92aWRlU2xhc2hDb21tYW5kKHNsYXNoY29tbWFuZCk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuY29uZmlnRXh0ZW5kZXI7XG5cdH1cblxuXHRwdWJsaWMgZ2V0RGVmYXVsdEFwcEFjY2Vzc29ycygpIHtcblx0XHRpZiAoIXRoaXMuZGVmYXVsdEFwcEFjY2Vzc29ycykge1xuXHRcdFx0dGhpcy5kZWZhdWx0QXBwQWNjZXNzb3JzID0ge1xuXHRcdFx0XHRlbnZpcm9ubWVudFJlYWRlcjogdGhpcy5nZXRFbnZpcm9ubWVudFJlYWQoKSxcblx0XHRcdFx0ZW52aXJvbm1lbnRXcml0ZXI6IHRoaXMuZ2V0RW52aXJvbm1lbnRXcml0ZSgpLFxuXHRcdFx0XHRyZWFkZXI6IHRoaXMuZ2V0UmVhZGVyKCksXG5cdFx0XHRcdGh0dHA6IHRoaXMuZ2V0SHR0cCgpLFxuXHRcdFx0XHRwcm92aWRlZEFwaUVuZHBvaW50czogQXBwT2JqZWN0UmVnaXN0cnkuZ2V0PElBcGlFbmRwb2ludE1ldGFkYXRhW10+KCdhcGlFbmRwb2ludHMnKSBhcyBJQXBpRW5kcG9pbnRNZXRhZGF0YVtdLFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5kZWZhdWx0QXBwQWNjZXNzb3JzO1xuXHR9XG5cblx0cHVibGljIGdldFJlYWRlcigpIHtcblx0XHRpZiAoIXRoaXMucmVhZGVyKSB7XG5cdFx0XHR0aGlzLnJlYWRlciA9IHtcblx0XHRcdFx0Z2V0RW52aXJvbm1lbnRSZWFkZXI6ICgpID0+ICh7XG5cdFx0XHRcdFx0Z2V0U2V0dGluZ3M6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldEVudmlyb25tZW50UmVhZGVyOmdldFNldHRpbmdzJyksXG5cdFx0XHRcdFx0Z2V0U2VydmVyU2V0dGluZ3M6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldEVudmlyb25tZW50UmVhZGVyOmdldFNlcnZlclNldHRpbmdzJyksXG5cdFx0XHRcdFx0Z2V0RW52aXJvbm1lbnRWYXJpYWJsZXM6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldEVudmlyb25tZW50UmVhZGVyOmdldEVudmlyb25tZW50VmFyaWFibGVzJyksXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRnZXRNZXNzYWdlUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRNZXNzYWdlUmVhZGVyJyksXG5cdFx0XHRcdGdldFBlcnNpc3RlbmNlUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRQZXJzaXN0ZW5jZVJlYWRlcicpLFxuXHRcdFx0XHRnZXRSb29tUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRSb29tUmVhZGVyJyksXG5cdFx0XHRcdGdldFVzZXJSZWFkZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldFVzZXJSZWFkZXInKSxcblx0XHRcdFx0Z2V0Tm90aWZpZXI6ICgpID0+IHRoaXMuZ2V0Tm90aWZpZXIoKSxcblx0XHRcdFx0Z2V0TGl2ZWNoYXRSZWFkZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldExpdmVjaGF0UmVhZGVyJyksXG5cdFx0XHRcdGdldFVwbG9hZFJlYWRlcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRSZWFkZXI6Z2V0VXBsb2FkUmVhZGVyJyksXG5cdFx0XHRcdGdldENsb3VkV29ya3NwYWNlUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRDbG91ZFdvcmtzcGFjZVJlYWRlcicpLFxuXHRcdFx0XHRnZXRWaWRlb0NvbmZlcmVuY2VSZWFkZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldFZpZGVvQ29uZmVyZW5jZVJlYWRlcicpLFxuXHRcdFx0XHRnZXRPQXV0aEFwcHNSZWFkZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldE9BdXRoQXBwc1JlYWRlcicpLFxuXHRcdFx0XHRnZXRUaHJlYWRSZWFkZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldFRocmVhZFJlYWRlcicpLFxuXHRcdFx0XHRnZXRSb2xlUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRSb2xlUmVhZGVyJyksXG5cdFx0XHRcdGdldENvbnRhY3RSZWFkZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0UmVhZGVyOmdldENvbnRhY3RSZWFkZXInKSxcblx0XHRcdFx0Z2V0RXhwZXJpbWVudGFsUmVhZGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldFJlYWRlcjpnZXRFeHBlcmltZW50YWxSZWFkZXInKSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMucmVhZGVyO1xuXHR9XG5cblx0cHVibGljIGdldE1vZGlmaWVyKCkge1xuXHRcdGlmICghdGhpcy5tb2RpZmllcikge1xuXHRcdFx0dGhpcy5tb2RpZmllciA9IHtcblx0XHRcdFx0Z2V0Q3JlYXRvcjogdGhpcy5nZXRDcmVhdG9yLmJpbmQodGhpcyksXG5cdFx0XHRcdGdldFVwZGF0ZXI6IHRoaXMuZ2V0VXBkYXRlci5iaW5kKHRoaXMpLFxuXHRcdFx0XHRnZXRFeHRlbmRlcjogdGhpcy5nZXRFeHRlbmRlci5iaW5kKHRoaXMpLFxuXHRcdFx0XHRnZXREZWxldGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldE1vZGlmaWVyOmdldERlbGV0ZXInKSxcblx0XHRcdFx0Z2V0Tm90aWZpZXI6ICgpID0+IHRoaXMuZ2V0Tm90aWZpZXIoKSxcblx0XHRcdFx0Z2V0VWlDb250cm9sbGVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldE1vZGlmaWVyOmdldFVpQ29udHJvbGxlcicpLFxuXHRcdFx0XHRnZXRTY2hlZHVsZXI6ICgpID0+IHRoaXMucHJveGlmeSgnZ2V0TW9kaWZpZXI6Z2V0U2NoZWR1bGVyJyksXG5cdFx0XHRcdGdldE9BdXRoQXBwc01vZGlmaWVyOiAoKSA9PiB0aGlzLnByb3hpZnkoJ2dldE1vZGlmaWVyOmdldE9BdXRoQXBwc01vZGlmaWVyJyksXG5cdFx0XHRcdGdldE1vZGVyYXRpb25Nb2RpZmllcjogKCkgPT4gdGhpcy5wcm94aWZ5KCdnZXRNb2RpZmllcjpnZXRNb2RlcmF0aW9uTW9kaWZpZXInKSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubW9kaWZpZXI7XG5cdH1cblxuXHRwdWJsaWMgZ2V0UGVyc2lzdGVuY2UoKSB7XG5cdFx0aWYgKCF0aGlzLnBlcnNpc3RlbmNlKSB7XG5cdFx0XHR0aGlzLnBlcnNpc3RlbmNlID0gdGhpcy5wcm94aWZ5KCdnZXRQZXJzaXN0ZW5jZScpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnBlcnNpc3RlbmNlO1xuXHR9XG5cblx0cHVibGljIGdldEh0dHAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaHR0cDtcblx0fVxuXG5cdHByaXZhdGUgZ2V0Q3JlYXRvcigpIHtcblx0XHRpZiAoIXRoaXMuY3JlYXRvcikge1xuXHRcdFx0dGhpcy5jcmVhdG9yID0gbmV3IE1vZGlmeUNyZWF0b3IodGhpcy5zZW5kZXJGbik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuY3JlYXRvcjtcblx0fVxuXG5cdHByaXZhdGUgZ2V0VXBkYXRlcigpIHtcblx0XHRpZiAoIXRoaXMudXBkYXRlcikge1xuXHRcdFx0dGhpcy51cGRhdGVyID0gbmV3IE1vZGlmeVVwZGF0ZXIodGhpcy5zZW5kZXJGbik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlcjtcblx0fVxuXG5cdHByaXZhdGUgZ2V0RXh0ZW5kZXIoKSB7XG5cdFx0aWYgKCF0aGlzLmV4dGVuZGVyKSB7XG5cdFx0XHR0aGlzLmV4dGVuZGVyID0gbmV3IE1vZGlmeUV4dGVuZGVyKHRoaXMuc2VuZGVyRm4pO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmV4dGVuZGVyO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXROb3RpZmllcigpIHtcblx0XHRyZXR1cm4gdGhpcy5ub3RpZmllcjtcblx0fVxufVxuXG5leHBvcnQgY29uc3QgQXBwQWNjZXNzb3JzSW5zdGFuY2UgPSBu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