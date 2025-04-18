/**
 *  MIT License
 *
 *  Copyright (c) 2023 Huawei Device Co., Ltd.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

import http from '@ohos.net.http';

export interface ILoginResultAPI {
    status: string
    data: {
        authToken: string,
        userId: string
    }
}

/** Structure for passing and keeping login credentials */
export interface ILoginCredentials {
    username: string,
    password: string
}

export class HttpRequestConnector {
    public httpRequest;
    public serverUrl;
    private currentLogin: {
        username: string,
        userId: string,
        authToken: string,
        result: ILoginResultAPI
    } | null = null
    private roomInfo: {
        rid: string,
        agentId: string,
        department: string
    }
    private visitorInfo: {
        visitorId: string,
        name: string,
        token: string,
        email: string,
        phone: number,
        term: string,
        customFields: {
            address: string,
            overwrite: boolean
        }
    }
    public authToken: string;
    public userID: string;
    private header: Object = { 'Content-Type': 'application/json' };

    constructor(url: string) {
        this.serverUrl = url;
    }

    /** Check result data for success, allowing override to ignore some errors */
    public success(result: any, ignore?: RegExp) {
        return (
                   (
                       typeof result.error === 'undefined' &&
                       typeof result.status === 'undefined' &&
                       typeof result.success === 'undefined'
                   ) ||
                   (result.status && result.status === 'success') ||
                   (result.success && result.success === true) ||
                   (ignore && result.error && !ignore.test(result.error))
               ) ? true : false
    }

    /**
     * Do a POST request to an API endpoint.
     * If it needs a token, login first (with defaults) to set auth headers.
     * @param endpoint The API endpoint (including version) e.g. `chat.update`
     * @param data     Payload for POST request to endpoint
     * @param auth     Require auth headers for endpoint, default true
     * @param ignore   Allows certain matching error messages to not count as errors
     */
    public async post(
        endpoint: string,
        data: any,
        auth: boolean = true,
        ignore?: RegExp
    ): Promise<any> {
        var that = this;
        this.httpRequest = http.createHttp();
        return new Promise(function (resolve, reject) {
            that.httpRequest.request(
                that.serverUrl + endpoint,
                {
                    method: 'POST',
                    header: that.header,
                    extraData: JSON.stringify(data),
                    readTimeout: 60000,
                    connectTimeout: 100000
                }, (err, data) => {
                if (!err) {
                    console.info('Result:' + JSON.stringify(data.result));
                    console.info('code:' + data.responseCode);
                    resolve(data.result);
                } else {
                    console.info('error:' + err.data);
                    reject(data)
                }
            }
            );
        });
    }

    /**
 * Do a GET request to an API endpoint
 * @param endpoint   The API endpoint (including version) e.g. `users.info`
 * @param data       Object to serialise for GET request query string
 * @param auth       Require auth headers for endpoint, default true
 * @param ignore     Allows certain matching error messages to not count as errors
 */
    public async get(
        endpoint: string,
        data?: any,
        auth: boolean = true,
        ignore?: RegExp
    ): Promise<any> {
        var that = this;
        this.httpRequest = http.createHttp();
        return new Promise(function (resolve, reject) {
            that.httpRequest.request(
                that.serverUrl + endpoint,
                {
                    method: 'GET',
                    header: that.header,
                    extraData: data,
                    readTimeout: 60000,
                    connectTimeout: 100000
                }, (err, data) => {
                if (!err) {
                    console.info('Result:' + JSON.stringify(data.result));
                    console.info('code:' + data.responseCode);
                    resolve(data.result);
                } else {
                    console.info('error:' + err.data);
                    reject(data)
                }
            }
            );
        });
    }

    public async delete(
        endpoint: string,
        auth: boolean = true,
        ignore?: RegExp
    ): Promise<any> {
        var that = this;
        this.httpRequest = http.createHttp();
        return new Promise(function (resolve, reject) {
            that.httpRequest.request(
                that.serverUrl + endpoint,
                {
                    method: 'DELETE',
                    header: {
                        'Content-Type': 'application/json'
                    },
                    readTimeout: 60000,
                    connectTimeout: 100000
                }, (err, data) => {
                if (!err) {
                    console.info('Result:' + JSON.stringify(data.result));
                    console.info('code:' + data.responseCode);
                    resolve(data.result);
                } else {
                    console.info('error:' + err.data);
                    reject(data)
                }
            }
            );
        });
    }

    public async put(
        endpoint: string,
        data: any,
        auth: boolean = true,
        ignore?: RegExp
    ): Promise<any> {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.httpRequest.request(
                that.serverUrl + endpoint,
                {
                    method: 'PUT',
                    header: that.header,
                    extraData: JSON.stringify(data),
                    readTimeout: 60000,
                    connectTimeout: 100000
                }, (err, data) => {
                if (!err) {
                    console.info('PUT Result:' + JSON.stringify(data.result));
                    console.info('PUT code:' + data.responseCode);
                    resolve(data.result);
                } else {
                    console.info('PUT error:' + err.data);
                    reject(data)
                }
            }
            );
        });
    }

    public setUserData(authToken, userID) {
        this.authToken = authToken;
        this.userID = userID;
        this.header = { 'Content-Type': 'application/json',
                        'X-Auth-Token': this.authToken,
                        'X-User-Id': this.userID
        };
    }

    /** Check for existing login */
    public loggedIn(): boolean {
        return (this.currentLogin !== null)
    }
}