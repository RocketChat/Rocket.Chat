import * as http from 'http';
import * as express from 'express';

declare module 'meteor/webapp' {
  namespace WebApp {
    var defaultArch: string;
    var clientPrograms: Record<string, any>;
    var connectHandlers: any;
    var rawConnectHandlers: any;
    var httpServer: http.Server;
    var expressApp: express.Application;
    function suppressConnectErrors(): void;
    function onListening(callback: Function): void;
    function startListening(httpServer: http.Server, listenOptions: any, cb: Function): void;
    function decodeRuntimeConfig(rtimeConfigStr: string): any;
    function encodeRuntimeConfig(rtimeConfig: any): string;
    function addRuntimeConfigHook(callback: Function): void;
    function addUpdatedNotifyHook(callback: Function): void;
    function addHtmlAttributeHook(hook: Function): void;
    function categorizeRequest(req: http.IncomingMessage): any;
  }

  namespace WebAppInternals {
    var NpmModules: {
      [key: string]: {
        version: string;
        module: any;
      };
    };
    function identifyBrowser(userAgentString: string): {
      name: string;
      major: number;
      minor: number;
      patch: number;
    };
    function registerBoilerplateDataCallback(key: string, callback: Function): Function | null;
    function generateBoilerplateInstance(arch: string, manifest: any, additionalOptions: any): any;
    function staticFilesMiddleware(staticFilesByArch: any, req: http.IncomingMessage, res: http.ServerResponse, next: Function): void;
    function parsePort(port: string | number): number;
    function reloadClientPrograms(): Promise<void>;
    function pauseClient(arch: string): Promise<void>;
    function generateClientProgram(arch: string): Promise<void>;
    function generateBoilerplate(): Promise<void>;
    function inlineScriptsAllowed(): boolean;
    function setInlineScriptsAllowed(value: boolean): Promise<void>;
    function enableSubresourceIntegrity(use_credentials?: boolean): Promise<void>;
    function setBundledJsCssUrlRewriteHook(hookFn: Function): Promise<void>;
    function setBundledJsCssPrefix(prefix: string): Promise<void>;
    function addStaticJs(contents: string): void;
  }
}
