
/*
 * Verto HTML5/Javascript Telephony Signaling and Control Protocol Stack for FreeSWITCH
 * Copyright (C) 2005-2014, Anthony Minessale II <anthm@freeswitch.org>
 *
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Verto HTML5/Javascript Telephony Signaling and Control Protocol Stack for FreeSWITCH
 *
 * The Initial Developer of the Original Code is
 * Anthony Minessale II <anthm@freeswitch.org>
 * Portions created by the Initial Developer are Copyright (C)
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Anthony Minessale II <anthm@freeswitch.org>
 *
 * jquery.verto.js - Main interface
 *
 */

(function($) {
    var sources = [];

    var generateGUID = (typeof(window.crypto) !== 'undefined' && typeof(window.crypto.getRandomValues) !== 'undefined') ?
    function() {
        // If we have a cryptographically secure PRNG, use that
        // http://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript
        var buf = new Uint16Array(8);
        window.crypto.getRandomValues(buf);
        var S4 = function(num) {
            var ret = num.toString(16);
            while (ret.length < 4) {
                ret = "0" + ret;
            }
            return ret;
        };
        return (S4(buf[0]) + S4(buf[1]) + "-" + S4(buf[2]) + "-" + S4(buf[3]) + "-" + S4(buf[4]) + "-" + S4(buf[5]) + S4(buf[6]) + S4(buf[7]));
    }

    :

    function() {
        // Otherwise, just use Math.random
        // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    /// MASTER OBJ
    $.verto = function(options, callbacks) {
        var verto = this;

        $.verto.saved.push(verto);

        verto.options = $.extend({
            login: null,
            passwd: null,
            socketUrl: null,
            tag: null,
	    localTag: null,
            videoParams: {},
            audioParams: {},
	    loginParams: {},
	    deviceParams: {onResCheck: null},
	    userVariables: {},
            iceServers: false,
            ringSleep: 6000,
	    sessid: null
        }, options);

	if (verto.options.deviceParams.useCamera) {
	    $.FSRTC.getValidRes(verto.options.deviceParams.useCamera, verto.options.deviceParams.onResCheck);
	}

	if (!verto.options.deviceParams.useMic) {
	    verto.options.deviceParams.useMic = "any";
	}

	if (!verto.options.deviceParams.useSpeak) {
	    verto.options.deviceParams.useSpeak = "any";
	}

	if (verto.options.sessid) {
	    verto.sessid = verto.options.sessid;
	} else {
            verto.sessid = localStorage.getItem("verto_session_uuid") || generateGUID();
	    localStorage.setItem("verto_session_uuid", verto.sessid);
	}

        verto.dialogs = {};
        verto.callbacks = callbacks || {};
        verto.eventSUBS = {};

        verto.rpcClient = new $.JsonRpcClient({
            login: verto.options.login,
            passwd: verto.options.passwd,
            socketUrl: verto.options.socketUrl,
	    loginParams: verto.options.loginParams,
	    userVariables: verto.options.userVariables,
            sessid: verto.sessid,
            onmessage: function(e) {
                return verto.handleMessage(e.eventData);
            },
            onWSConnect: function(o) {
                o.call('login', {});
            },
            onWSLogin: function(success) {
                if (verto.callbacks.onWSLogin) {
                    verto.callbacks.onWSLogin(verto, success);
                }
            },
            onWSClose: function(success) {
                if (verto.callbacks.onWSClose) {
                    verto.callbacks.onWSClose(verto, success);
                }
                verto.purge();
            }
        });

        if (verto.options.ringFile && verto.options.tag) {
            verto.ringer = $("#" + verto.options.tag);
        }

        verto.rpcClient.call('login', {});

    };


    $.verto.prototype.deviceParams = function(obj) {
        var verto = this;

	for (var i in obj) {
            verto.options.deviceParams[i] = obj[i];
	}

	if (obj.useCamera) {
	    $.FSRTC.getValidRes(verto.options.deviceParams.useCamera, obj ? obj.onResCheck : undefined);
	}
    };

    $.verto.prototype.videoParams = function(obj) {
        var verto = this;

	for (var i in obj) {
            verto.options.videoParams[i] = obj[i];
	}
    };

    $.verto.prototype.iceServers = function(obj) {
        var verto = this;
        verto.options.iceServers = obj;
    };

    $.verto.prototype.loginData = function(params) {
	var verto = this;
        verto.options.login = params.login;
        verto.options.passwd = params.passwd;
        verto.rpcClient.loginData(params);
    };

    $.verto.prototype.logout = function(msg) {
        var verto = this;
        verto.rpcClient.closeSocket();
        if (verto.callbacks.onWSClose) {
            verto.callbacks.onWSClose(verto, false);
        }
        verto.purge();
    };

    $.verto.prototype.login = function(msg) {
        var verto = this;
        verto.logout();
        verto.rpcClient.call('login', {});
    };

    $.verto.prototype.message = function(msg) {
        var verto = this;
        var err = 0;

        if (!msg.to) {
            console.error("Missing To");
            err++;
        }

        if (!msg.body) {
            console.error("Missing Body");
            err++;
        }

        if (err) {
            return false;
        }

        verto.sendMethod("verto.info", {
            msg: msg
        });

        return true;
    };

    $.verto.prototype.processReply = function(method, success, e) {
        var verto = this;
        var i;

        //console.log("Response: " + method, success, e);

        switch (method) {
        case "verto.subscribe":
            for (i in e.unauthorizedChannels) {
                drop_bad(verto, e.unauthorizedChannels[i]);
            }
            for (i in e.subscribedChannels) {
                mark_ready(verto, e.subscribedChannels[i]);
            }

            break;
        case "verto.unsubscribe":
            //console.error(e);
            break;
        }
    };

    $.verto.prototype.sendMethod = function(method, params) {
        var verto = this;

        verto.rpcClient.call(method, params,

        function(e) {
            /* Success */
            verto.processReply(method, true, e);
        },

        function(e) {
            /* Error */
            verto.processReply(method, false, e);
        });
    };

    function do_sub(verto, channel, obj) {

    }

    function drop_bad(verto, channel) {
        console.error("drop unauthorized channel: " + channel);
        delete verto.eventSUBS[channel];
    }

    function mark_ready(verto, channel) {
        for (var j in verto.eventSUBS[channel]) {
            verto.eventSUBS[channel][j].ready = true;
            console.log("subscribed to channel: " + channel);
            if (verto.eventSUBS[channel][j].readyHandler) {
                verto.eventSUBS[channel][j].readyHandler(verto, channel);
            }
        }
    }

    var SERNO = 1;

    function do_subscribe(verto, channel, subChannels, sparams) {
        var params = sparams || {};

        var local = params.local;

        var obj = {
            eventChannel: channel,
            userData: params.userData,
            handler: params.handler,
            ready: false,
            readyHandler: params.readyHandler,
            serno: SERNO++
        };

        var isnew = false;

        if (!verto.eventSUBS[channel]) {
            verto.eventSUBS[channel] = [];
            subChannels.push(channel);
            isnew = true;
        }

        verto.eventSUBS[channel].push(obj);

        if (local) {
            obj.ready = true;
            obj.local = true;
        }

        if (!isnew && verto.eventSUBS[channel][0].ready) {
            obj.ready = true;
            if (obj.readyHandler) {
                obj.readyHandler(verto, channel);
            }
        }

        return {
            serno: obj.serno,
            eventChannel: channel
        };

    }

    $.verto.prototype.subscribe = function(channel, sparams) {
        var verto = this;
        var r = [];
        var subChannels = [];
        var params = sparams || {};

        if (typeof(channel) === "string") {
            r.push(do_subscribe(verto, channel, subChannels, params));
        } else {
            for (var i in channel) {
                r.push(do_subscribe(verto, channel, subChannels, params));
            }
        }

        if (subChannels.length) {
            verto.sendMethod("verto.subscribe", {
                eventChannel: subChannels.length == 1 ? subChannels[0] : subChannels,
                subParams: params.subParams
            });
        }

        return r;
    };

    $.verto.prototype.unsubscribe = function(handle) {
        var verto = this;
        var i;

        if (!handle) {
            for (i in verto.eventSUBS) {
                if (verto.eventSUBS[i]) {
                    verto.unsubscribe(verto.eventSUBS[i]);
                }
            }
        } else {
            var unsubChannels = {};
            var sendChannels = [];
            var channel;

            if (typeof(handle) == "string") {
                delete verto.eventSUBS[handle];
                unsubChannels[handle]++;
            } else {
                for (i in handle) {
                    if (typeof(handle[i]) == "string") {
                        channel = handle[i];
                        delete verto.eventSUBS[channel];
                        unsubChannels[channel]++;
                    } else {
                        var repl = [];
                        channel = handle[i].eventChannel;

                        for (var j in verto.eventSUBS[channel]) {
                            if (verto.eventSUBS[channel][j].serno == handle[i].serno) {} else {
                                repl.push(verto.eventSUBS[channel][j]);
                            }
                        }

                        verto.eventSUBS[channel] = repl;

                        if (verto.eventSUBS[channel].length === 0) {
                            delete verto.eventSUBS[channel];
                            unsubChannels[channel]++;
                        }
                    }
                }
            }

            for (var u in unsubChannels) {
                console.log("Sending Unsubscribe for: ", u);
                sendChannels.push(u);
            }

            if (sendChannels.length) {
                verto.sendMethod("verto.unsubscribe", {
                    eventChannel: sendChannels.length == 1 ? sendChannels[0] : sendChannels
                });
            }
        }
    };

    $.verto.prototype.broadcast = function(channel, params) {
        var verto = this;
        var msg = {
            eventChannel: channel,
            data: {}
        };
        for (var i in params) {
            msg.data[i] = params[i];
        }
        verto.sendMethod("verto.broadcast", msg);
    };

    $.verto.prototype.purge = function(callID) {
        var verto = this;
        var x = 0;
        var i;

        for (i in verto.dialogs) {
            if (!x) {
                console.log("purging dialogs");
            }
            x++;
            verto.dialogs[i].setState($.verto.enum.state.purge);
        }

        for (i in verto.eventSUBS) {
            if (verto.eventSUBS[i]) {
                console.log("purging subscription: " + i);
                delete verto.eventSUBS[i];
            }
        }
    };

    $.verto.prototype.hangup = function(callID) {
        var verto = this;
        if (callID) {
            var dialog = verto.dialogs[callID];

            if (dialog) {
                dialog.hangup();
            }
        } else {
            for (var i in verto.dialogs) {
                verto.dialogs[i].hangup();
            }
        }
    };

    $.verto.prototype.newCall = function(args, callbacks) {
        var verto = this;

        if (!verto.rpcClient.socketReady()) {
            console.error("Not Connected...");
            return;
        }

        var dialog = new $.verto.dialog($.verto.enum.direction.outbound, this, args);

        dialog.invite();

        if (callbacks) {
            dialog.callbacks = callbacks;
        }

        return dialog;
    };

    $.verto.prototype.handleMessage = function(data) {
        var verto = this;

        if (!(data && data.method)) {
            console.error("Invalid Data", data);
            return;
        }

        if (data.params.callID) {
            var dialog = verto.dialogs[data.params.callID];
	    
	    if (data.method === "verto.attach" && dialog) {
		delete dialog.verto.dialogs[dialog.callID];
		dialog.rtc.stop();
		dialog = null;
	    }

            if (dialog) {

                switch (data.method) {
                case 'verto.bye':
                    dialog.hangup(data.params);
                    break;
                case 'verto.answer':
                    dialog.handleAnswer(data.params);
                    break;
                case 'verto.media':
                    dialog.handleMedia(data.params);
                    break;
                case 'verto.display':
                    dialog.handleDisplay(data.params);
                    break;
                case 'verto.info':
                    dialog.handleInfo(data.params);
                    break;
                default:
                    console.debug("INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED", dialog, data.method);
                    break;
                }
            } else {

                switch (data.method) {
                case 'verto.attach':
                    data.params.attach = true;

                    if (data.params.sdp && data.params.sdp.indexOf("m=video") > 0) {
                        data.params.useVideo = true;
                    }

                    if (data.params.sdp && data.params.sdp.indexOf("stereo=1") > 0) {
                        data.params.useStereo = true;
                    }

                    dialog = new $.verto.dialog($.verto.enum.direction.inbound, verto, data.params);
                    dialog.setState($.verto.enum.state.recovering);

                    break;
                case 'verto.invite':

                    if (data.params.sdp && data.params.sdp.indexOf("m=video") > 0) {
                        data.params.wantVideo = true;
                    }

                    if (data.params.sdp && data.params.sdp.indexOf("stereo=1") > 0) {
                        data.params.useStereo = true;
                    }

                    dialog = new $.verto.dialog($.verto.enum.direction.inbound, verto, data.params);
                    break;
                default:
                    console.debug("INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED");
                    break;
                }
            }

            return {
                method: data.method
            };
        } else {
            switch (data.method) {
            case 'verto.punt':
                verto.purge();
		verto.logout();
		break;
            case 'verto.event':
                var list = null;
                var key = null;

                if (data.params) {
                    key = data.params.eventChannel;
                }

                if (key) {
                    list = verto.eventSUBS[key];

                    if (!list) {
                        list = verto.eventSUBS[key.split(".")[0]];
                    }
                }

                if (!list && key && key === verto.sessid) {
                    if (verto.callbacks.onMessage) {
                        verto.callbacks.onMessage(verto, null, $.verto.enum.message.pvtEvent, data.params);
                    }
                } else if (!list && key && verto.dialogs[key]) {
                    verto.dialogs[key].sendMessage($.verto.enum.message.pvtEvent, data.params);
                } else if (!list) {
                    if (!key) {
                        key = "UNDEFINED";
                    }
                    console.error("UNSUBBED or invalid EVENT " + key + " IGNORED");
                } else {
                    for (var i in list) {
                        var sub = list[i];

                        if (!sub || !sub.ready) {
                            console.error("invalid EVENT for " + key + " IGNORED");
                        } else if (sub.handler) {
                            sub.handler(verto, data.params, sub.userData);
                        } else if (verto.callbacks.onEvent) {
                            verto.callbacks.onEvent(verto, data.params, sub.userData);
                        } else {
                            console.log("EVENT:", data.params);
                        }
                    }
                }

                break;

            case "verto.info":
                if (verto.callbacks.onMessage) {
                    verto.callbacks.onMessage(verto, null, $.verto.enum.message.info, data.params.msg);
                }
                //console.error(data);
                console.debug("MESSAGE from: " + data.params.msg.from, data.params.msg.body);

                break;

            default:
                console.error("INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED", data.method);
                break;
            }
        }
    };

    var del_array = function(array, name) {
        var r = [];
        var len = array.length;

        for (var i = 0; i < len; i++) {
            if (array[i] != name) {
                r.push(array[i]);
            }
        }

        return r;
    };

    var hashArray = function() {
        var vha = this;

        var hash = {};
        var array = [];

        vha.reorder = function(a) {
            array = a;
            var h = hash;
            hash = {};

            var len = array.length;

            for (var i = 0; i < len; i++) {
                var key = array[i];
                if (h[key]) {
                    hash[key] = h[key];
                    delete h[key];
                }
            }
            h = undefined;
        };

        vha.clear = function() {
            hash = undefined;
            array = undefined;
            hash = {};
            array = [];
        };

        vha.add = function(name, val, insertAt) {
            var redraw = false;

            if (!hash[name]) {
                if (insertAt === undefined || insertAt < 0 || insertAt >= array.length) {
                    array.push(name);
                } else {
                    var x = 0;
                    var n = [];
                    var len = array.length;

                    for (var i = 0; i < len; i++) {
                        if (x++==insertAt) {
                            n.push(name);
                        }
                        n.push(array[i]);
                    }

                    array = undefined;
                    array = n;
                    n = undefined;
                    redraw = true;
                }
            }

            hash[name] = val;

            return redraw;
        };

        vha.del = function(name) {
            var r = false;

            if (hash[name]) {
                array = del_array(array, name);
                delete hash[name];
                r = true;
            } else {
                console.error("can't del nonexistant key " + name);
            }

            return r;
        };

        vha.get = function(name) {
            return hash[name];
        };

        vha.order = function() {
            return array;
        };

        vha.hash = function() {
            return hash;
        };

        vha.indexOf = function(name) {
            var len = array.length;

            for (var i = 0; i < len; i++) {
                if (array[i] == name) {
                    return i;
                }
            }
        };

        vha.arrayLen = function() {
            return array.length;
        };

        vha.asArray = function() {
            var r = [];

            var len = array.length;

            for (var i = 0; i < len; i++) {
                var key = array[i];
                r.push(hash[key]);
            }

            return r;
        };

        vha.each = function(cb) {
            var len = array.length;

            for (var i = 0; i < len; i++) {
                cb(array[i], hash[array[i]]);
            }
        };

        vha.dump = function(html) {
            var str = "";

            vha.each(function(name, val) {
                str += "name: " + name + " val: " + JSON.stringify(val) + (html ? "<br>" : "\n");
            });

            return str;
        };

    };

    $.verto.liveArray = function(verto, context, name, config) {
        var la = this;
        var lastSerno = 0;
        var binding = null;
        var user_obj = config.userObj;
        var local = false;

        // Inherit methods of hashArray
        hashArray.call(la);

        // Save the hashArray add, del, reorder, clear methods so we can make our own.
        la._add = la.add;
        la._del = la.del;
        la._reorder = la.reorder;
        la._clear = la.clear;

        la.context = context;
        la.name = name;
        la.user_obj = user_obj;

        la.verto = verto;
        la.broadcast = function(channel, obj) {
            verto.broadcast(channel, obj);
        };
        la.errs = 0;

        la.clear = function() {
            la._clear();
            lastSerno = 0;

            if (la.onChange) {
                la.onChange(la, {
                    action: "clear"
                });
            }
        };

        la.checkSerno = function(serno) {
            if (serno < 0) {
                return true;
            }

            if (lastSerno > 0 && serno != (lastSerno + 1)) {
                if (la.onErr) {
                    la.onErr(la, {
                        lastSerno: lastSerno,
                        serno: serno
                    });
                }
                la.errs++;
                console.debug(la.errs);
                if (la.errs < 3) {
                    la.bootstrap(la.user_obj);
                }
                return false;
            } else {
                lastSerno = serno;
                return true;
            }
        };

        la.reorder = function(serno, a) {
            if (la.checkSerno(serno)) {
                la._reorder(a);
                if (la.onChange) {
                    la.onChange(la, {
                        serno: serno,
                        action: "reorder"
                    });
                }
            }
        };

        la.init = function(serno, val, key, index) {
            if (key === null || key === undefined) {
                key = serno;
            }
            if (la.checkSerno(serno)) {
                if (la.onChange) {
                    la.onChange(la, {
                        serno: serno,
                        action: "init",
                        index: index,
                        key: key,
                        data: val
                    });
                }
            }
        };

        la.bootObj = function(serno, val) {
            if (la.checkSerno(serno)) {

                //la.clear();
                for (var i in val) {
                    la._add(val[i][0], val[i][1]);
                }

                if (la.onChange) {
                    la.onChange(la, {
                        serno: serno,
                        action: "bootObj",
                        data: val,
                        redraw: true
                    });
                }
            }
        };

        // @param serno  La is the serial number for la particular request.
        // @param key    If looking at it as a hash table, la represents the key in the hashArray object where you want to store the val object.
        // @param index  If looking at it as an array, la represents the position in the array where you want to store the val object.
        // @param val    La is the object you want to store at the key or index location in the hash table / array.
        la.add = function(serno, val, key, index) {
            if (key === null || key === undefined) {
                key = serno;
            }
            if (la.checkSerno(serno)) {
                var redraw = la._add(key, val, index);
                if (la.onChange) {
                    la.onChange(la, {
                        serno: serno,
                        action: "add",
                        index: index,
                        key: key,
                        data: val,
                        redraw: redraw
                    });
                }
            }
        };

        la.modify = function(serno, val, key, index) {
            if (key === null || key === undefined) {
                key = serno;
            }
            if (la.checkSerno(serno)) {
                la._add(key, val, index);
                if (la.onChange) {
                    la.onChange(la, {
                        serno: serno,
                        action: "modify",
                        key: key,
                        data: val,
                        index: index
                    });
                }
            }
        };

        la.del = function(serno, key, index) {
            if (key === null || key === undefined) {
                key = serno;
            }
            if (la.checkSerno(serno)) {
                if (index === null || index < 0 || index === undefined) {
                    index = la.indexOf(key);
                }
                var ok = la._del(key);

                if (ok && la.onChange) {
                    la.onChange(la, {
                        serno: serno,
                        action: "del",
                        key: key,
                        index: index
                    });
                }
            }
        };

        var eventHandler = function(v, e, la) {
            var packet = e.data;

            //console.error("READ:", packet);

            if (packet.name != la.name) {
                return;
            }

            switch (packet.action) {

            case "init":
                la.init(packet.wireSerno, packet.data, packet.hashKey, packet.arrIndex);
                break;

            case "bootObj":
                la.bootObj(packet.wireSerno, packet.data);
                break;
            case "add":
                la.add(packet.wireSerno, packet.data, packet.hashKey, packet.arrIndex);
                break;

            case "modify":
                if (! (packet.arrIndex || packet.hashKey)) {
                    console.error("Invalid Packet", packet);
                } else {
                    la.modify(packet.wireSerno, packet.data, packet.hashKey, packet.arrIndex);
                }
                break;
            case "del":
                if (! (packet.arrIndex || packet.hashKey)) {
                    console.error("Invalid Packet", packet);
                } else {
                    la.del(packet.wireSerno, packet.hashKey, packet.arrIndex);
                }
                break;

            case "clear":
                la.clear();
                break;

            case "reorder":
                la.reorder(packet.wireSerno, packet.order);
                break;

            default:
                if (la.checkSerno(packet.wireSerno)) {
                    if (la.onChange) {
                        la.onChange(la, {
                            serno: packet.wireSerno,
                            action: packet.action,
                            data: packet.data
                        });
                    }
                }
                break;
            }
        };

        if (la.context) {
            binding = la.verto.subscribe(la.context, {
                handler: eventHandler,
                userData: la,
                subParams: config.subParams
            });
        }

        la.destroy = function() {
            la._clear();
            la.verto.unsubscribe(binding);
        };

        la.sendCommand = function(cmd, obj) {
            var self = la;
            self.broadcast(self.context, {
                liveArray: {
                    command: cmd,
                    context: self.context,
                    name: self.name,
                    obj: obj
                }
            });
        };

        la.bootstrap = function(obj) {
            var self = la;
            la.sendCommand("bootstrap", obj);
            //self.heartbeat();
        };

        la.changepage = function(obj) {
            var self = la;
            self.clear();
            self.broadcast(self.context, {
                liveArray: {
                    command: "changepage",
                    context: la.context,
                    name: la.name,
                    obj: obj
                }
            });
        };

        la.heartbeat = function(obj) {
            var self = la;

            var callback = function() {
                self.heartbeat.call(self, obj);
            };
            self.broadcast(self.context, {
                liveArray: {
                    command: "heartbeat",
                    context: self.context,
                    name: self.name,
                    obj: obj
                }
            });
            self.hb_pid = setTimeout(callback, 30000);
        };

        la.bootstrap(la.user_obj);
    };

    $.verto.liveTable = function(verto, context, name, jq, config) {
        var dt;
        var la = new $.verto.liveArray(verto, context, name, {
            subParams: config.subParams
        });
        var lt = this;

        lt.liveArray = la;
        lt.dataTable = dt;
        lt.verto = verto;

        lt.destroy = function() {
            if (dt) {
                dt.fnDestroy();
            }
            if (la) {
                la.destroy();
            }

            dt = null;
            la = null;
        };

        la.onErr = function(obj, args) {
            console.error("Error: ", obj, args);
        };

	/* back compat so jsonstatus can always be enabled */
	function genRow(data) {
	    if (typeof(data[4]) === "string" && data[4].indexOf("{") > -1) {
		var tmp = $.parseJSON(data[4]);
		data[4] = tmp.oldStatus;
		data[5] = null;
	    }
	    return data;
	}

	function genArray(obj) {
	    var data = obj.asArray();

            for (var i in data) {
		data[i] = genRow(data[i]);
	    }

	    return data;
	}


        la.onChange = function(obj, args) {
            var index = 0;
            var iserr = 0;

            if (!dt) {
                if (!config.aoColumns) {
                    if (args.action != "init") {
                        return;
                    }

                    config.aoColumns = [];

                    for (var i in args.data) {
                        config.aoColumns.push({
                            "sTitle": args.data[i]
                        });
                    }
                }

                dt = jq.dataTable(config);
            }

            if (dt && (args.action == "del" || args.action == "modify")) {
                index = args.index;

                if (index === undefined && args.key) {
                    index = la.indexOf(args.key);
                }

                if (index === undefined) {
                    console.error("INVALID PACKET Missing INDEX\n", args);
                    return;
                }
            }

            if (config.onChange) {
                config.onChange(obj, args);
            }

            try {
                switch (args.action) {
                case "bootObj":
                    if (!args.data) {
                        console.error("missing data");
                        return;
                    }
                    dt.fnClearTable();
                    dt.fnAddData(genArray(obj));
                    dt.fnAdjustColumnSizing();
                    break;
                case "add":
                    if (!args.data) {
                        console.error("missing data");
                        return;
                    }
                    if (args.redraw > -1) {
                        // specific position, more costly
                        dt.fnClearTable();
                        dt.fnAddData(genArray(obj));
                    } else {
                        dt.fnAddData(genRow(args.data));
                    }
                    dt.fnAdjustColumnSizing();
                    break;
                case "modify":
                    if (!args.data) {
                        return;
                    }
                    //console.debug(args, index);
                    dt.fnUpdate(genRow(args.data), index);
                    dt.fnAdjustColumnSizing();
                    break;
                case "del":
                    dt.fnDeleteRow(index);
                    dt.fnAdjustColumnSizing();
                    break;
                case "clear":
                    dt.fnClearTable();
                    break;
                case "reorder":
                    // specific position, more costly
                    dt.fnClearTable();
                    dt.fnAddData(genArray(obj));
                    break;
                case "hide":
                    jq.hide();
                    break;

                case "show":
                    jq.show();
                    break;

                }
            } catch(err) {
                console.error("ERROR: " + err);
                iserr++;
            }

            if (iserr) {
                obj.errs++;
                if (obj.errs < 3) {
                    obj.bootstrap(obj.user_obj);
                }
            } else {
                obj.errs = 0;
            }

        };

        la.onChange(la, {
            action: "init"
        });

    };

    var CONFMAN_SERNO = 1;

    /*
        Conference Manager without jQuery table.
     */

    $.verto.conf = function(verto, params) {
        var conf = this;

        conf.params = $.extend({
            dialog: null,
            hasVid: false,
            laData: null,
            onBroadcast: null,
            onLaChange: null,
            onLaRow: null
        }, params);

        conf.verto = verto;
        conf.serno = CONFMAN_SERNO++;

        createMainModeratorMethods();

        verto.subscribe(conf.params.laData.modChannel, {
            handler: function(v, e) {
                if (conf.params.onBroadcast) {
                    conf.params.onBroadcast(verto, conf, e.data);
                }
            }
        });

        verto.subscribe(conf.params.laData.chatChannel, {
            handler: function(v, e) {
                if (typeof(conf.params.chatCallback) === "function") {
                    conf.params.chatCallback(v,e);
                }
            }
        });
    };

    $.verto.conf.prototype.modCommand = function(cmd, id, value) {
        var conf = this;

        conf.verto.rpcClient.call("verto.broadcast", {
            "eventChannel": conf.params.laData.modChannel,
            "data": {
                "application": "conf-control",
                "command": cmd,
                "id": id,
                "value": value
            }
        });
    };

    $.verto.conf.prototype.destroy = function() {
        var conf = this;

        conf.destroyed = true;
        conf.params.onBroadcast(conf.verto, conf, 'destroy');

        if (conf.params.laData.modChannel) {
            conf.verto.unsubscribe(conf.params.laData.modChannel);
        }

        if (conf.params.laData.chatChannel) {
            conf.verto.unsubscribe(conf.params.laData.chatChannel);
        }
    };

    function createMainModeratorMethods() {
        $.verto.conf.prototype.listVideoLayouts = function() {
            this.modCommand("list-videoLayouts", null, null);
        };

        $.verto.conf.prototype.play = function(file) {
            this.modCommand("play", null, file);
        };

        $.verto.conf.prototype.stop = function() {
            this.modCommand("stop", null, "all");
        };

        $.verto.conf.prototype.record = function(file) {
            this.modCommand("recording", null, ["start", file]);
        };

        $.verto.conf.prototype.stopRecord = function() {
            this.modCommand("recording", null, ["stop", "all"]);
        };

        $.verto.conf.prototype.snapshot = function(file) {
            if (!this.params.hasVid) {
                throw 'Conference has no video';
            }
            this.modCommand("vid-write-png", null, file);
        };

        $.verto.conf.prototype.setVideoLayout = function(layout, canvasID) {
            if (!this.params.hasVid) {
                throw 'Conference has no video';
            }
	    if (canvasID) {
		this.modCommand("vid-layout", null, [layout, canvasID]);
	    } else {
		this.modCommand("vid-layout", null, layout);
	    }
        };

        $.verto.conf.prototype.kick = function(memberID) {
            this.modCommand("kick", parseInt(memberID));
        };

        $.verto.conf.prototype.muteMic = function(memberID) {
            this.modCommand("tmute", parseInt(memberID));
        };

        $.verto.conf.prototype.muteVideo = function(memberID) {
            if (!this.params.hasVid) {
                throw 'Conference has no video';
            }
            this.modCommand("tvmute", parseInt(memberID));
        };

        $.verto.conf.prototype.presenter = function(memberID) {
            if (!this.params.hasVid) {
                throw 'Conference has no video';
            }
            this.modCommand("vid-res-id", parseInt(memberID), "presenter");
        };

        $.verto.conf.prototype.videoFloor = function(memberID) {
            if (!this.params.hasVid) {
                throw 'Conference has no video';
            }
            this.modCommand("vid-floor", parseInt(memberID), "force");
        };

        $.verto.conf.prototype.banner = function(memberID, text) {
            if (!this.params.hasVid) {
                throw 'Conference has no video';
            }
            this.modCommand("vid-banner", parseInt(memberID), escape(text));
        };

        $.verto.conf.prototype.volumeDown = function(memberID) {
            this.modCommand("volume_out", parseInt(memberID), "down");
        };

        $.verto.conf.prototype.volumeUp = function(memberID) {
            this.modCommand("volume_out", parseInt(memberID), "up");
        };

        $.verto.conf.prototype.gainDown = function(memberID) {
            this.modCommand("volume_in", parseInt(memberID), "down");
        };

        $.verto.conf.prototype.gainUp = function(memberID) {
            this.modCommand("volume_in", parseInt(memberID), "up");
        };

        $.verto.conf.prototype.transfer = function(memberID, exten) {
            this.modCommand("transfer", parseInt(memberID), exten);
        };

        $.verto.conf.prototype.sendChat = function(message, type) {
            var conf = this;
            conf.verto.rpcClient.call("verto.broadcast", {
                "eventChannel": conf.params.laData.chatChannel,
                "data": {
                    "action": "send",
                    "message": message,
                    "type": type
                }
            });
        };
            
    }

    $.verto.modfuncs = {};

    $.verto.confMan = function(verto, params) {
        var confMan = this;

        confMan.params = $.extend({
            tableID: null,
            statusID: null,
            mainModID: null,
            dialog: null,
            hasVid: false,
            laData: null,
            onBroadcast: null,
            onLaChange: null,
            onLaRow: null
        }, params);

        confMan.verto = verto;
        confMan.serno = CONFMAN_SERNO++;
	confMan.canvasCount = confMan.params.laData.canvasCount;
	
        function genMainMod(jq) {
            var play_id = "play_" + confMan.serno;
            var stop_id = "stop_" + confMan.serno;
            var recording_id = "recording_" + confMan.serno;
            var snapshot_id = "snapshot_" + confMan.serno;
            var rec_stop_id = "recording_stop" + confMan.serno;
            var div_id = "confman_" + confMan.serno;

            var html =  "<div id='" + div_id + "'><br>" +
		"<button class='ctlbtn' id='" + play_id + "'>Play</button>" +
		"<button class='ctlbtn' id='" + stop_id + "'>Stop</button>" +
		"<button class='ctlbtn' id='" + recording_id + "'>Record</button>" +
		"<button class='ctlbtn' id='" + rec_stop_id + "'>Record Stop</button>" +
		(confMan.params.hasVid ? "<button class='ctlbtn' id='" + snapshot_id + "'>PNG Snapshot</button>" : "") +
		"<br><br></div>";

            jq.html(html);

	    $.verto.modfuncs.change_video_layout = function(id, canvas_id) {	    
		var val = $("#" + id + " option:selected").text();
		if (val !== "none") {
                    confMan.modCommand("vid-layout", null, [val, canvas_id]);
		}
	    };

	    if (confMan.params.hasVid) {
		for (var j = 0; j < confMan.canvasCount; j++) {
		    var vlayout_id = "confman_vid_layout_" + j + "_" + confMan.serno;
		    var vlselect_id = "confman_vl_select_" + j + "_" + confMan.serno;
		

		    var vlhtml =  "<div id='" + vlayout_id + "'><br>" +
			"<b>Video Layout Canvas " + (j+1) + 
			"</b> <select onChange='$.verto.modfuncs.change_video_layout(\"" + vlayout_id + "\", \"" + (j+1) + "\")' id='" + vlselect_id + "'></select> " +
			"<br><br></div>";
		    jq.append(vlhtml);
		}

		$("#" + snapshot_id).click(function() {
                    var file = prompt("Please enter file name", "");
		    if (file) {
			confMan.modCommand("vid-write-png", null, file);
		    }
		});
	    }

            $("#" + play_id).click(function() {
                var file = prompt("Please enter file name", "");
		if (file) {
                    confMan.modCommand("play", null, file);
		}
            });

            $("#" + stop_id).click(function() {
                confMan.modCommand("stop", null, "all");
            });

            $("#" + recording_id).click(function() {
                var file = prompt("Please enter file name", "");
		if (file) {
                    confMan.modCommand("recording", null, ["start", file]);
		}
            });

            $("#" + rec_stop_id).click(function() {
                confMan.modCommand("recording", null, ["stop", "all"]);
            });

        }

        function genControls(jq, rowid) {
            var x = parseInt(rowid);
            var kick_id = "kick_" + x;
            var canvas_in_next_id = "canvas_in_next_" + x;
            var canvas_in_prev_id = "canvas_in_prev_" + x;
            var canvas_out_next_id = "canvas_out_next_" + x;
            var canvas_out_prev_id = "canvas_out_prev_" + x;

            var canvas_in_set_id = "canvas_in_set_" + x;
            var canvas_out_set_id = "canvas_out_set_" + x;

            var layer_set_id = "layer_set_" + x;
            var layer_next_id = "layer_next_" + x;
            var layer_prev_id = "layer_prev_" + x;
	    
            var tmute_id = "tmute_" + x;
            var tvmute_id = "tvmute_" + x;
            var vbanner_id = "vbanner_" + x;
            var tvpresenter_id = "tvpresenter_" + x;
            var tvfloor_id = "tvfloor_" + x;
            var box_id = "box_" + x;
            var gainup_id = "gain_in_up" + x;
            var gaindn_id = "gain_in_dn" + x;
            var volup_id = "vol_in_up" + x;
            var voldn_id = "vol_in_dn" + x;
            var transfer_id = "transfer" + x;
	    

            var html = "<div id='" + box_id + "'>";

	    html += "<b>General Controls</b><hr noshade>";

            html += "<button class='ctlbtn' id='" + kick_id + "'>Kick</button>" +
                "<button class='ctlbtn' id='" + tmute_id + "'>Mute</button>" +
                "<button class='ctlbtn' id='" + gainup_id + "'>Gain -</button>" +
                "<button class='ctlbtn' id='" + gaindn_id + "'>Gain +</button>" +
                "<button class='ctlbtn' id='" + voldn_id + "'>Vol -</button>" +
                "<button class='ctlbtn' id='" + volup_id + "'>Vol +</button>" +
                "<button class='ctlbtn' id='" + transfer_id + "'>Transfer</button>";
		
	    if (confMan.params.hasVid) {
		html += "<br><br><b>Video Controls</b><hr noshade>";


                html += "<button class='ctlbtn' id='" + tvmute_id + "'>VMute</button>" +
                    "<button class='ctlbtn' id='" + tvpresenter_id + "'>Presenter</button>" +
                    "<button class='ctlbtn' id='" + tvfloor_id + "'>Vid Floor</button>" +
                    "<button class='ctlbtn' id='" + vbanner_id + "'>Banner</button>";

		if (confMan.canvasCount > 1) {
                    html += "<br><br><b>Canvas Controls</b><hr noshade>" +
			"<button class='ctlbtn' id='" + canvas_in_set_id + "'>Set Input Canvas</button>" +
			"<button class='ctlbtn' id='" + canvas_in_prev_id + "'>Prev Input Canvas</button>" +
			"<button class='ctlbtn' id='" + canvas_in_next_id + "'>Next Input Canvas</button>" +
			
		    "<br>" +
			
		    "<button class='ctlbtn' id='" + canvas_out_set_id + "'>Set Watching Canvas</button>" +
			"<button class='ctlbtn' id='" + canvas_out_prev_id + "'>Prev Watching Canvas</button>" +
			"<button class='ctlbtn' id='" + canvas_out_next_id + "'>Next Watching Canvas</button>";
		}
		
		html += "<br>" +

                "<button class='ctlbtn' id='" + layer_set_id + "'>Set Layer</button>" +
                    "<button class='ctlbtn' id='" + layer_prev_id + "'>Prev Layer</button>" +
                    "<button class='ctlbtn' id='" + layer_next_id + "'>Next Layer</button>" +



                    "</div>";
            }

            jq.html(html);


            if (!jq.data("mouse")) {
                $("#" + box_id).hide();
            }

            jq.mouseover(function(e) {
                jq.data({"mouse": true});
                $("#" + box_id).show();
            });

            jq.mouseout(function(e) {
                jq.data({"mouse": false});
                $("#" + box_id).hide();
            });

            $("#" + transfer_id).click(function() {
                var xten = prompt("Enter Extension");
		if (xten) {
                    confMan.modCommand("transfer", x, xten);
		}
            });

            $("#" + kick_id).click(function() {
                confMan.modCommand("kick", x);
            });


            $("#" + layer_set_id).click(function() {
                var cid = prompt("Please enter layer ID", "");
		if (cid) {
                    confMan.modCommand("vid-layer", x, cid);
		}
            });

            $("#" + layer_next_id).click(function() {
                confMan.modCommand("vid-layer", x, "next");
            });
            $("#" + layer_prev_id).click(function() {
                confMan.modCommand("vid-layer", x, "prev");
            });

            $("#" + canvas_in_set_id).click(function() {
                var cid = prompt("Please enter canvas ID", "");
		if (cid) {
                    confMan.modCommand("vid-canvas", x, cid);
		}
            });

            $("#" + canvas_out_set_id).click(function() {
                var cid = prompt("Please enter canvas ID", "");
		if (cid) {
                    confMan.modCommand("vid-watching-canvas", x, cid);
		}
            });

            $("#" + canvas_in_next_id).click(function() {
                confMan.modCommand("vid-canvas", x, "next");
            });
            $("#" + canvas_in_prev_id).click(function() {
                confMan.modCommand("vid-canvas", x, "prev");
            });


            $("#" + canvas_out_next_id).click(function() {
                confMan.modCommand("vid-watching-canvas", x, "next");
            });
            $("#" + canvas_out_prev_id).click(function() {
                confMan.modCommand("vid-watching-canvas", x, "prev");
            });
	    
            $("#" + tmute_id).click(function() {
                confMan.modCommand("tmute", x);
            });

	    if (confMan.params.hasVid) {
		$("#" + tvmute_id).click(function() {
                    confMan.modCommand("tvmute", x);
		});
		$("#" + tvpresenter_id).click(function() {
                    confMan.modCommand("vid-res-id", x, "presenter");
		});
		$("#" + tvfloor_id).click(function() {
                    confMan.modCommand("vid-floor", x, "force");
		});
		$("#" + vbanner_id).click(function() {
                    var text = prompt("Please enter text", "");
		    if (text) {
			confMan.modCommand("vid-banner", x, escape(text));
		    }
		});
	    }

            $("#" + gainup_id).click(function() {
                confMan.modCommand("volume_in", x, "up");
            });

            $("#" + gaindn_id).click(function() {
                confMan.modCommand("volume_in", x, "down");
            });

            $("#" + volup_id).click(function() {
                confMan.modCommand("volume_out", x, "up");
            });

            $("#" + voldn_id).click(function() {
                confMan.modCommand("volume_out", x, "down");
            });

            return html;
        }

        var atitle = "";
        var awidth = 0;

        //$(".jsDataTable").width(confMan.params.hasVid ? "900px" : "800px");

	verto.subscribe(confMan.params.laData.chatChannel, {
	    handler: function(v, e) {
		if (typeof(confMan.params.chatCallback) === "function") {
		    confMan.params.chatCallback(v,e);
		}
	    }
	});

        if (confMan.params.laData.role === "moderator") {
            atitle = "Action";
            awidth = 600;

            if (confMan.params.mainModID) {
                genMainMod($(confMan.params.mainModID));
                $(confMan.params.displayID).html("Moderator Controls Ready<br><br>");
            } else {
                $(confMan.params.mainModID).html("");
            }

            verto.subscribe(confMan.params.laData.modChannel, {
                handler: function(v, e) {
                    //console.error("MODDATA:", e.data);
                    if (confMan.params.onBroadcast) {
                        confMan.params.onBroadcast(verto, confMan, e.data);
                    }

		    if (e.data["conf-command"] === "list-videoLayouts") {
			for (var j = 0; j < confMan.canvasCount; j++) {
			    var vlselect_id = "#confman_vl_select_" + j + "_" + confMan.serno;
			    var vlayout_id = "#confman_vid_layout_" + j + "_" + confMan.serno;
			    
			    var x = 0;
			    var options;
			    
			    $(vlselect_id).selectmenu({});
			    $(vlselect_id).selectmenu("enable");
			    $(vlselect_id).empty();
			    
			    $(vlselect_id).append(new Option("Choose a Layout", "none"));

			    if (e.data.responseData) {
				var rdata = [];

				for (var i in e.data.responseData) {
				    rdata.push(e.data.responseData[i].name);
				}
				
				options = rdata.sort(function(a, b) {
				    var ga = a.substring(0, 6) == "group:" ? true : false;
				    var gb = b.substring(0, 6) == "group:" ? true : false;
				    
				    if ((ga || gb) && ga != gb) {
					return ga ? -1 : 1;
				    }
				    
				    return ( ( a == b ) ? 0 : ( ( a > b ) ? 1 : -1 ) );
				});

				for (var i in options) {
				    $(vlselect_id).append(new Option(options[i], options[i]));
				    x++;
				}
			    }

			    if (x) {
				$(vlselect_id).selectmenu('refresh', true);
			    } else {
				$(vlayout_id).hide();
			    }
			}
		    } else {

			if (!confMan.destroyed && confMan.params.displayID) {
                            $(confMan.params.displayID).html(e.data.response + "<br><br>");
                            if (confMan.lastTimeout) {
				clearTimeout(confMan.lastTimeout);
				confMan.lastTimeout = 0;
                            }
                            confMan.lastTimeout = setTimeout(function() { $(confMan.params.displayID).html(confMan.destroyed ? "" : "Moderator Controls Ready<br><br>");}, 4000);
			}
		    }
                }
            });


	    if (confMan.params.hasVid) {
		confMan.modCommand("list-videoLayouts", null, null);
	    }
        }

        var row_callback = null;

        if (confMan.params.laData.role === "moderator") {
            row_callback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                if (!aData[5]) {
                    var $row = $('td:eq(5)', nRow);
                    genControls($row, aData);

                    if (confMan.params.onLaRow) {
                        confMan.params.onLaRow(verto, confMan, $row, aData);
                    }
                }
            };
        }

        confMan.lt = new $.verto.liveTable(verto, confMan.params.laData.laChannel, confMan.params.laData.laName, $(confMan.params.tableID), {
            subParams: {
                callID: confMan.params.dialog ? confMan.params.dialog.callID : null
            },

            "onChange": function(obj, args) {
                $(confMan.params.statusID).text("Conference Members: " + " (" + obj.arrayLen() + " Total)");
                if (confMan.params.onLaChange) {
                    confMan.params.onLaChange(verto, confMan, $.verto.enum.confEvent.laChange, obj, args);
                }
            },

            "aaData": [],
            "aoColumns": [
                {
                    "sTitle": "ID",
                    "sWidth": "50"
                },
                {
                    "sTitle": "Number",
		    "sWidth": "250"
                },
                {
                    "sTitle": "Name",
		    "sWidth": "250"
                },
                {
                    "sTitle": "Codec",
                    "sWidth": "100"
                },
                {
                    "sTitle": "Status",
                    "sWidth": confMan.params.hasVid ? "200px" : "150px"
                },
                {
                    "sTitle": atitle,
                    "sWidth": awidth,
                }
            ],
            "bAutoWidth": true,
            "bDestroy": true,
            "bSort": false,
            "bInfo": false,
            "bFilter": false,
            "bLengthChange": false,
            "bPaginate": false,
            "iDisplayLength": 1400,

            "oLanguage": {
                "sEmptyTable": "The Conference is Empty....."
            },

            "fnRowCallback": row_callback

        });
    };

    $.verto.confMan.prototype.modCommand = function(cmd, id, value) {
        var confMan = this;

        confMan.verto.rpcClient.call("verto.broadcast", {
            "eventChannel": confMan.params.laData.modChannel,
            "data": {
		"application": "conf-control",
		"command": cmd,
		"id": id,
		"value": value
            }
	});
    };

    $.verto.confMan.prototype.sendChat = function(message, type) {
        var confMan = this;
        confMan.verto.rpcClient.call("verto.broadcast", {
            "eventChannel": confMan.params.laData.chatChannel,
            "data": {
		"action": "send",
		"message": message,
		"type": type
            }
	});
    };


    $.verto.confMan.prototype.destroy = function() {
        var confMan = this;

        confMan.destroyed = true;

        if (confMan.lt) {
            confMan.lt.destroy();
        }

        if (confMan.params.laData.chatChannel) {
            confMan.verto.unsubscribe(confMan.params.laData.chatChannel);
        }

        if (confMan.params.laData.modChannel) {
            confMan.verto.unsubscribe(confMan.params.laData.modChannel);
        }

        if (confMan.params.mainModID) {
            $(confMan.params.mainModID).html("");
        }
    };

    $.verto.dialog = function(direction, verto, params) {
        var dialog = this;

        dialog.params = $.extend({
            useVideo: verto.options.useVideo,
            useStereo: verto.options.useStereo,
	    screenShare: false,
	    useCamera: verto.options.deviceParams.useCamera,
	    useMic: verto.options.deviceParams.useMic,
	    useSpeak: verto.options.deviceParams.useSpeak,
            tag: verto.options.tag,
            localTag: verto.options.localTag,
            login: verto.options.login,
	    videoParams: verto.options.videoParams
        }, params);
	
        dialog.verto = verto;
        dialog.direction = direction;
        dialog.lastState = null;
        dialog.state = dialog.lastState = $.verto.enum.state.new;
        dialog.callbacks = verto.callbacks;
        dialog.answered = false;
        dialog.attach = params.attach || false;
	dialog.screenShare = params.screenShare || false;
	dialog.useCamera = dialog.params.useCamera;
	dialog.useMic = dialog.params.useMic;
	dialog.useSpeak = dialog.params.useSpeak;
	
        if (dialog.params.callID) {
            dialog.callID = dialog.params.callID;
        } else {
            dialog.callID = dialog.params.callID = generateGUID();
        }
	
        if (dialog.params.tag) {
            dialog.audioStream = document.getElementById(dialog.params.tag);

            if (dialog.params.useVideo) {
                dialog.videoStream = dialog.audioStream;
            }
        } //else conjure one TBD

        if (dialog.params.localTag) {
	    dialog.localVideo = document.getElementById(dialog.params.localTag);
	}

        dialog.verto.dialogs[dialog.callID] = dialog;

        var RTCcallbacks = {};

        if (dialog.direction == $.verto.enum.direction.inbound) {
            if (dialog.params.display_direction === "outbound") {
                dialog.params.remote_caller_id_name = dialog.params.caller_id_name;
                dialog.params.remote_caller_id_number = dialog.params.caller_id_number;
            } else {
                dialog.params.remote_caller_id_name = dialog.params.callee_id_name;
                dialog.params.remote_caller_id_number = dialog.params.callee_id_number;
            }

            if (!dialog.params.remote_caller_id_name) {
                dialog.params.remote_caller_id_name = "Nobody";
            }

            if (!dialog.params.remote_caller_id_number) {
                dialog.params.remote_caller_id_number = "UNKNOWN";
            }

            RTCcallbacks.onMessage = function(rtc, msg) {
                console.debug(msg);
            };

            RTCcallbacks.onAnswerSDP = function(rtc, sdp) {
                console.error("answer sdp", sdp);
            };
        } else {
            dialog.params.remote_caller_id_name = "Outbound Call";
            dialog.params.remote_caller_id_number = dialog.params.destination_number;
        }

        RTCcallbacks.onICESDP = function(rtc) {
            console.log("RECV " + rtc.type + " SDP", rtc.mediaData.SDP);

	    if (dialog.state == $.verto.enum.state.requesting || dialog.state == $.verto.enum.state.answering || dialog.state == $.verto.enum.state.active) {
		location.reload();
		return;
	    }

            if (rtc.type == "offer") {
		if (dialog.state == $.verto.enum.state.active) {
                    dialog.setState($.verto.enum.state.requesting);
		    dialog.sendMethod("verto.attach", {
			sdp: rtc.mediaData.SDP
                    });
		} else {
                    dialog.setState($.verto.enum.state.requesting);
		    
                    dialog.sendMethod("verto.invite", {
			sdp: rtc.mediaData.SDP
                    });
		}
            } else { //answer
                dialog.setState($.verto.enum.state.answering);

                dialog.sendMethod(dialog.attach ? "verto.attach" : "verto.answer", {
                    sdp: dialog.rtc.mediaData.SDP
                });
            }
        };

        RTCcallbacks.onICE = function(rtc) {
            //console.log("cand", rtc.mediaData.candidate);
            if (rtc.type == "offer") {
                console.log("offer", rtc.mediaData.candidate);
                return;
            }
        };

        RTCcallbacks.onStream = function(rtc, stream) {
            console.log("stream started");
        };

        RTCcallbacks.onError = function(e) {
            console.error("ERROR:", e);
            dialog.hangup({cause: "Device or Permission Error"});
        };

        dialog.rtc = new $.FSRTC({
            callbacks: RTCcallbacks,
	    localVideo: dialog.screenShare ? null : dialog.localVideo,
            useVideo: dialog.params.useVideo ? dialog.videoStream : null,
            useAudio: dialog.audioStream,
            useStereo: dialog.params.useStereo,
            videoParams: dialog.params.videoParams,
            audioParams: verto.options.audioParams,
            iceServers: verto.options.iceServers,
	    screenShare: dialog.screenShare,
	    useCamera: dialog.useCamera,
	    useMic: dialog.useMic,
	    useSpeak: dialog.useSpeak
        });

        dialog.rtc.verto = dialog.verto;

        if (dialog.direction == $.verto.enum.direction.inbound) {
            if (dialog.attach) {
                dialog.answer();
            } else {
                dialog.ring();
            }
        }
    };

    $.verto.dialog.prototype.invite = function() {
        var dialog = this;
        dialog.rtc.call();
    };

    $.verto.dialog.prototype.sendMethod = function(method, obj) {
        var dialog = this;
        obj.dialogParams = {};

        for (var i in dialog.params) {
            if (i == "sdp" && method != "verto.invite" && method != "verto.attach") {
                continue;
            }

            obj.dialogParams[i] = dialog.params[i];
        }

        dialog.verto.rpcClient.call(method, obj,

        function(e) {
            /* Success */
            dialog.processReply(method, true, e);
        },

        function(e) {
            /* Error */
            dialog.processReply(method, false, e);
        });
    };

    function checkStateChange(oldS, newS) {

        if (newS == $.verto.enum.state.purge || $.verto.enum.states[oldS.name][newS.name]) {
            return true;
        }

        return false;
    }


    // Attach audio output device to video element using device/sink ID.                                                                                           
    function find_name(id) {
	for (var i in $.verto.audioOutDevices) {
	    var source = $.verto.audioOutDevices[i];
	    if (source.id === id) {
		return(source.label);
	    }
	}

	return id;
    }

    $.verto.dialog.prototype.setAudioPlaybackDevice = function(sinkId, callback, arg) {
	var dialog = this;
	var element = dialog.audioStream;

	if (typeof element.sinkId !== 'undefined') {
	    var devname = find_name(sinkId);
	    console.info("Dialog: " + dialog.callID + " Setting speaker:", element, devname);

	    element.setSinkId(sinkId)
		.then(function() {
		    console.log("Dialog: " + dialog.callID + ' Success, audio output device attached: ' + sinkId);
		    if (callback) {
			callback(true, devname, arg);
		    }
		})
		.catch(function(error) {
		    var errorMessage = error;
		    if (error.name === 'SecurityError') {
			errorMessage = "Dialog: " + dialog.callID + ' You need to use HTTPS for selecting audio output ' +
			    'device: ' + error;
		    }
		    if (callback) {
			callback(false, null, arg);
		    }
		    console.error(errorMessage);
		});
	} else {
	    console.warn("Dialog: " + dialog.callID + ' Browser does not support output device selection.');
	    if (callback) {
		callback(false, null, arg);
	    }
	}
    }

    $.verto.dialog.prototype.setState = function(state) {
        var dialog = this;

        if (dialog.state == $.verto.enum.state.ringing) {
            dialog.stopRinging();
        }

        if (dialog.state == state || !checkStateChange(dialog.state, state)) {
            console.error("Dialog " + dialog.callID + ": INVALID state change from " + dialog.state.name + " to " + state.name);
            dialog.hangup();
            return false;
        }

        console.log("Dialog " + dialog.callID + ": state change from " + dialog.state.name + " to " + state.name);

        dialog.lastState = dialog.state;
        dialog.state = state;

        if (!dialog.causeCode) {
            dialog.causeCode = 16;
        }

        if (!dialog.cause) {
            dialog.cause = "NORMAL CLEARING";
        }

        if (dialog.callbacks.onDialogState) {
            dialog.callbacks.onDialogState(this);
        }

        switch (dialog.state) {

        case $.verto.enum.state.early:
        case $.verto.enum.state.active:

	    var speaker = dialog.useSpeak;
	    console.info("Using Speaker: ", speaker);

	    if (speaker && speaker !== "any" && speaker !== "none") {
		setTimeout(function() {
		    dialog.setAudioPlaybackDevice(speaker);
		}, 500);
	    }

	    break;

        case $.verto.enum.state.trying:
            setTimeout(function() {
                if (dialog.state == $.verto.enum.state.trying) {
                    dialog.setState($.verto.enum.state.hangup);
                }
            }, 30000);
            break;
        case $.verto.enum.state.purge:
            dialog.setState($.verto.enum.state.destroy);
            break;
        case $.verto.enum.state.hangup:

            if (dialog.lastState.val > $.verto.enum.state.requesting.val && dialog.lastState.val < $.verto.enum.state.hangup.val) {
                dialog.sendMethod("verto.bye", {});
            }

            dialog.setState($.verto.enum.state.destroy);
            break;
        case $.verto.enum.state.destroy:
            delete dialog.verto.dialogs[dialog.callID];
	    if (dialog.params.screenShare) {
		dialog.rtc.stopPeer();
	    } else {
		dialog.rtc.stop();
	    }
            break;
        }

        return true;
    };

    $.verto.dialog.prototype.processReply = function(method, success, e) {
        var dialog = this;

        //console.log("Response: " + method + " State:" + dialog.state.name, success, e);

        switch (method) {

        case "verto.answer":
        case "verto.attach":
            if (success) {
                dialog.setState($.verto.enum.state.active);
            } else {
                dialog.hangup();
            }
            break;
        case "verto.invite":
            if (success) {
                dialog.setState($.verto.enum.state.trying);
            } else {
                dialog.setState($.verto.enum.state.destroy);
            }
            break;

        case "verto.bye":
            dialog.hangup();
            break;

        case "verto.modify":
            if (e.holdState) {
                if (e.holdState == "held") {
                    if (dialog.state != $.verto.enum.state.held) {
                        dialog.setState($.verto.enum.state.held);
                    }
                } else if (e.holdState == "active") {
                    if (dialog.state != $.verto.enum.state.active) {
                        dialog.setState($.verto.enum.state.active);
                    }
                }
            }

            if (success) {}

            break;

        default:
            break;
        }

    };

    $.verto.dialog.prototype.hangup = function(params) {
        var dialog = this;

        if (params) {
            if (params.causeCode) {
		dialog.causeCode = params.causeCode;
            }

            if (params.cause) {
		dialog.cause = params.cause;
            }
        }

        if (dialog.state.val >= $.verto.enum.state.new.val && dialog.state.val < $.verto.enum.state.hangup.val) {
            dialog.setState($.verto.enum.state.hangup);
        } else if (dialog.state.val < $.verto.enum.state.destroy) {
            dialog.setState($.verto.enum.state.destroy);
        }
    };

    $.verto.dialog.prototype.stopRinging = function() {
        var dialog = this;
        if (dialog.verto.ringer) {
            dialog.verto.ringer.stop();
        }
    };

    $.verto.dialog.prototype.indicateRing = function() {
        var dialog = this;

        if (dialog.verto.ringer) {
            dialog.verto.ringer.attr("src", dialog.verto.options.ringFile)[0].play();

            setTimeout(function() {
                dialog.stopRinging();
                if (dialog.state == $.verto.enum.state.ringing) {
                    dialog.indicateRing();
                }
            },
            dialog.verto.options.ringSleep);
        }
    };

    $.verto.dialog.prototype.ring = function() {
        var dialog = this;

        dialog.setState($.verto.enum.state.ringing);
        dialog.indicateRing();
    };

    $.verto.dialog.prototype.useVideo = function(on) {
        var dialog = this;

        dialog.params.useVideo = on;

        if (on) {
            dialog.videoStream = dialog.audioStream;
        } else {
            dialog.videoStream = null;
        }

        dialog.rtc.useVideo(dialog.videoStream, dialog.localVideo);

    };

    $.verto.dialog.prototype.setMute = function(what) {
	var dialog = this;
	return dialog.rtc.setMute(what);
    };

    $.verto.dialog.prototype.getMute = function() {
	var dialog = this; 
	return dialog.rtc.getMute();
    };

    $.verto.dialog.prototype.setVideoMute = function(what) {
	var dialog = this;
	return dialog.rtc.setVideoMute(what);
    };

    $.verto.dialog.prototype.getVideoMute = function() {
	var dialog = this; 
	return dialog.rtc.getVideoMute();
    };

    $.verto.dialog.prototype.useStereo = function(on) {
        var dialog = this;

        dialog.params.useStereo = on;
        dialog.rtc.useStereo(on);
    };

    $.verto.dialog.prototype.dtmf = function(digits) {
        var dialog = this;
        if (digits) {
            dialog.sendMethod("verto.info", {
                dtmf: digits
            });
        }
    };

    $.verto.dialog.prototype.transfer = function(dest, params) {
        var dialog = this;
        if (dest) {
            dialog.sendMethod("verto.modify", {
                action: "transfer",
                destination: dest,
                params: params
            });
        }
    };

    $.verto.dialog.prototype.hold = function(params) {
        var dialog = this;

        dialog.sendMethod("verto.modify", {
            action: "hold",
            params: params
        });
    };

    $.verto.dialog.prototype.unhold = function(params) {
        var dialog = this;

        dialog.sendMethod("verto.modify", {
            action: "unhold",
            params: params
        });
    };

    $.verto.dialog.prototype.toggleHold = function(params) {
        var dialog = this;

        dialog.sendMethod("verto.modify", {
            action: "toggleHold",
            params: params
        });
    };

    $.verto.dialog.prototype.message = function(msg) {
        var dialog = this;
        var err = 0;

        msg.from = dialog.params.login;

        if (!msg.to) {
            console.error("Missing To");
            err++;
        }

        if (!msg.body) {
            console.error("Missing Body");
            err++;
        }

        if (err) {
            return false;
        }

        dialog.sendMethod("verto.info", {
            msg: msg
        });

        return true;
    };

    $.verto.dialog.prototype.answer = function(params) {
        var dialog = this;
	
        if (!dialog.answered) {
	    if (!params) {
		params = {};
	    }

	    params.sdp = dialog.params.sdp;

            if (params) {
                if (params.useVideo) {
                    dialog.useVideo(true);
                }
		dialog.params.callee_id_name = params.callee_id_name;
		dialog.params.callee_id_number = params.callee_id_number;

		if (params.useCamera) {
		    dialog.useCamera = params.useCamera;
		}

		if (params.useMic) {
		    dialog.useMic = params.useMic;
		}

		if (params.useSpeak) {
		    dialog.useSpeak = params.useSpeak;
		}
            }
	    
            dialog.rtc.createAnswer(params);
            dialog.answered = true;
        }
    };

    $.verto.dialog.prototype.handleAnswer = function(params) {
        var dialog = this;

        dialog.gotAnswer = true;

        if (dialog.state.val >= $.verto.enum.state.active.val) {
            return;
        }

        if (dialog.state.val >= $.verto.enum.state.early.val) {
            dialog.setState($.verto.enum.state.active);
        } else {
            if (dialog.gotEarly) {
                console.log("Dialog " + dialog.callID + " Got answer while still establishing early media, delaying...");
            } else {
                console.log("Dialog " + dialog.callID + " Answering Channel");
                dialog.rtc.answer(params.sdp, function() {
                    dialog.setState($.verto.enum.state.active);
                }, function(e) {
                    console.error(e);
                    dialog.hangup();
                });
                console.log("Dialog " + dialog.callID + "ANSWER SDP", params.sdp);
            }
        }


    };

    $.verto.dialog.prototype.cidString = function(enc) {
        var dialog = this;
        var party = dialog.params.remote_caller_id_name + (enc ? " &lt;" : " <") + dialog.params.remote_caller_id_number + (enc ? "&gt;" : ">");
        return party;
    };

    $.verto.dialog.prototype.sendMessage = function(msg, params) {
        var dialog = this;

        if (dialog.callbacks.onMessage) {
            dialog.callbacks.onMessage(dialog.verto, dialog, msg, params);
        }
    };

    $.verto.dialog.prototype.handleInfo = function(params) {
        var dialog = this;

        dialog.sendMessage($.verto.enum.message.info, params.msg);
    };

    $.verto.dialog.prototype.handleDisplay = function(params) {
        var dialog = this;

        if (params.display_name) {
            dialog.params.remote_caller_id_name = params.display_name;
        }
        if (params.display_number) {
            dialog.params.remote_caller_id_number = params.display_number;
        }

        dialog.sendMessage($.verto.enum.message.display, {});
    };

    $.verto.dialog.prototype.handleMedia = function(params) {
        var dialog = this;

        if (dialog.state.val >= $.verto.enum.state.early.val) {
            return;
        }

        dialog.gotEarly = true;

        dialog.rtc.answer(params.sdp, function() {
            console.log("Dialog " + dialog.callID + "Establishing early media");
            dialog.setState($.verto.enum.state.early);

            if (dialog.gotAnswer) {
                console.log("Dialog " + dialog.callID + "Answering Channel");
                dialog.setState($.verto.enum.state.active);
            }
        }, function(e) {
            console.error(e);
            dialog.hangup();
        });
        console.log("Dialog " + dialog.callID + "EARLY SDP", params.sdp);
    };

    $.verto.ENUM = function(s) {
        var i = 0,
        o = {};
        s.split(" ").map(function(x) {
            o[x] = {
                name: x,
                val: i++
            };
        });
        return Object.freeze(o);
    };

    $.verto.enum = {};

    $.verto.enum.states = Object.freeze({
        new: {
            requesting: 1,
            recovering: 1,
            ringing: 1,
            destroy: 1,
            answering: 1,
	    hangup: 1
        },
        requesting: {
            trying: 1,
            hangup: 1,
	    active: 1
        },
        recovering: {
            answering: 1,
            hangup: 1
        },
        trying: {
            active: 1,
            early: 1,
            hangup: 1
        },
        ringing: {
            answering: 1,
            hangup: 1
        },
        answering: {
            active: 1,
            hangup: 1
        },
        active: {
            answering: 1,
            requesting: 1,
            hangup: 1,
            held: 1
        },
        held: {
            hangup: 1,
            active: 1
        },
        early: {
            hangup: 1,
            active: 1
        },
        hangup: {
            destroy: 1
        },
        destroy: {},
        purge: {
            destroy: 1
        }
    });

    $.verto.enum.state = $.verto.ENUM("new requesting trying recovering ringing answering early active held hangup destroy purge");
    $.verto.enum.direction = $.verto.ENUM("inbound outbound");
    $.verto.enum.message = $.verto.ENUM("display info pvtEvent");

    $.verto.enum = Object.freeze($.verto.enum);

    $.verto.saved = [];
    
    $.verto.unloadJobs = [];

    $(window).bind('beforeunload', function() {
	for (var f in $.verto.unloadJobs) {
	    $.verto.unloadJobs[f]();
	}

        for (var i in $.verto.saved) {
            var verto = $.verto.saved[i];
            if (verto) {
                verto.purge();
                verto.logout();
            }
        }

        return $.verto.warnOnUnload;
    });

    $.verto.videoDevices = [];
    $.verto.audioInDevices = [];
    $.verto.audioOutDevices = [];

    var checkDevices = function(runtime) {
	console.info("enumerating devices");
	var aud_in = [], aud_out = [], vid = [];	

	if ((!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) && MediaStreamTrack.getSources) {
	    MediaStreamTrack.getSources(function (media_sources) {
		for (var i = 0; i < media_sources.length; i++) {

		    if (media_sources[i].kind == 'video') {
			vid.push(media_sources[i]);
		    } else {
			aud_in.push(media_sources[i]);
		    }
		}
		
		$.verto.videoDevices = vid;
		$.verto.audioInDevices = aud_in;
		
		console.info("Audio Devices", $.verto.audioInDevices);
		console.info("Video Devices", $.verto.videoDevices);
		runtime(true);
	    });
	} else {
	    /* of course it's a totally different API CALL with different element names for the same exact thing */
	    
	    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
		console.log("enumerateDevices() not supported.");
		return;
	    }

	    // List cameras and microphones.

	    navigator.mediaDevices.enumerateDevices()
		.then(function(devices) {
		    devices.forEach(function(device) {
			console.log(device);

			console.log(device.kind + ": " + device.label +
				    " id = " + device.deviceId);
			
			if (device.kind === "videoinput") {
			    vid.push({id: device.deviceId, kind: "video", label: device.label});
			} else if (device.kind === "audioinput") {
			    aud_in.push({id: device.deviceId, kind: "audio_in", label: device.label});
			} else if (device.kind === "audiooutput") {
			    aud_out.push({id: device.deviceId, kind: "audio_out", label: device.label});
			}
		    });
		    

		    $.verto.videoDevices = vid;
		    $.verto.audioInDevices = aud_in;
		    $.verto.audioOutDevices = aud_out;
		    
		    console.info("Audio IN Devices", $.verto.audioInDevices);
		    console.info("Audio Out Devices", $.verto.audioOutDevices);
		    console.info("Video Devices", $.verto.videoDevices);
		    runtime(true);
		    
		})
		.catch(function(err) {
		    console.log(" Device Enumeration ERROR: " + err.name + ": " + err.message);
		    runtime(false);
		});
	}

    };

    $.verto.refreshDevices = function(runtime) {
	checkDevices(runtime);
    }

    $.verto.init = function(obj, runtime) {
	if (!obj) {
	    obj = {};
	}

	if (!obj.skipPermCheck && !obj.skipDeviceCheck) {
	    $.FSRTC.checkPerms(function(status) {
		checkDevices(runtime);
	    }, true, true);
	} else if (obj.skipPermCheck && !obj.skipDeviceCheck) {
	    checkDevices(runtime);
	} else if (!obj.skipPermCheck && obj.skipDeviceCheck) {
	    $.FSRTC.checkPerms(function(status) {
		runtime(status);
	    }, true, true);
	} else {
	    runtime(null);
	}

    }

    $.verto.genUUID = function () {
	return generateGUID();
    }


})(jQuery);
