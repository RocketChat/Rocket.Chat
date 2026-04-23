import * as http from "http";
import * as express from "express";

export interface StaticFiles {
  [key: string]: {
    content?: string | undefined;
    absolutePath: string;
    cacheable: boolean;
    hash: string;
    sourceMapUrl?: string | undefined;
    type: string;
  };
}

type ExpressModule = {
  (): express.Application;
  json: typeof express.json;
  raw: typeof express.raw;
  Router: typeof express.Router;
  static: typeof express.static;
  text: typeof express.text;
  urlencoded: typeof express.urlencoded;
};

export declare module WebApp {
  var defaultArch: string;
  var clientPrograms: {
    [key: string]: {
      format: string;
      manifest: any;
      version: string;
      cordovaCompatibilityVersions?: any;
      PUBLIC_SETTINGS: any;
    };
  };
  /**
   * @deprecated use handlers instead
   */
  var connectHandlers: express.Application;
  var handlers: express.Application;
  /**
   * @deprecated use rawHandlers instead
   */
  var rawConnectHandlers: express.Application;
  var rawHandlers: express.Application;
  var httpServer: http.Server;
  var expressApp: express.Application;
  var express: ExpressModule;
  /**
   * Should be used only for testing
   * @deprecated use _suppressExpressErrors instead
   */
  function suppressConnectErrors(): void;
  /**
   * Should be used only for testing
   */
  function _suppressExpressErrors(): void;
  function onListening(callback: Function): void;

  type RuntimeConfigHookCallback = (options: {
    arch: "web.browser" | "web.browser.legacy" | "web.cordova";
    request: http.IncomingMessage;
    encodedCurrentConfig: string;
    updated: boolean;
  }) => string | undefined | null | false;
  function addRuntimeConfigHook(callback: RuntimeConfigHookCallback): void;
  function decodeRuntimeConfig(rtimeConfigString: string): unknown;
  function encodeRuntimeConfig(rtimeConfig: unknown): string;
  function addHtmlAttributeHook(hook: Function): void;
}

export declare module WebAppInternals {
  var NpmModules: {
    [key: string]: {
      version: string;
      module: any;
    };
  };
  function identifyBrowser(userAgentString: string): {
    name: string;
    major: string;
    minor: string;
    patch: string;
  };
  function registerBoilerplateDataCallback(
    key: string,
    callback: Function
  ): Function;
  function generateBoilerplateInstance(
    arch: string,
    manifest: any,
    additionalOptions: any
  ): any;

  function staticFilesMiddleware(
    staticFiles: StaticFiles,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: Function
  ): void;
  function parsePort(port: string): number;
  function reloadClientPrograms(): void;
  function generateBoilerplate(): void;
  var staticFiles: StaticFiles;
  function inlineScriptsAllowed(): boolean;
  function setInlineScriptsAllowed(inlineScriptsAllowed: boolean): void;

  function setBundledJsCssUrlRewriteHook(hookFn: (url: string) => string): void;
  function setBundledJsCssPrefix(bundledJsCssPrefix: string): void;
  function addStaticJs(): void;
  function getBoilerplate(request: http.IncomingMessage, arch: string): string;
  var additionalStaticJs: any;
}
