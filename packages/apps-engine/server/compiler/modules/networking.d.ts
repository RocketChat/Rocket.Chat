import type * as http from 'http';
import type * as https from 'https';
import type * as net from 'net';
type IHttp = typeof http;
type IHttps = typeof https;
type INet = typeof net;
type NetworkingLibs = IHttp | IHttps | INet;
export declare const moduleHandlerFactory: (module: string) => (appId: string) => ProxyHandler<NetworkingLibs>;
export {};
