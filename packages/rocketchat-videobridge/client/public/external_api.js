/**
 * Implements API class that embeds Jitsi Meet in external applications.
 */
var JitsiMeetExternalAPI = (function()
{
    /**
     * The minimum width for the Jitsi Meet frame
     * @type {number}
     */
    var MIN_WIDTH = 790;

    /**
     * The minimum height for the Jitsi Meet frame
     * @type {number}
     */
    var MIN_HEIGHT = 300;

    /**
     * Constructs new API instance. Creates iframe element that loads
     * Jitsi Meet.
     * @param domain the domain name of the server that hosts the conference
     * @param room_name the name of the room to join
     * @param width width of the iframe
     * @param height height of the iframe
     * @param parent_node the node that will contain the iframe
     * @param filmStripOnly if the value is true only the small videos will be
     * visible.
     * @constructor
     */
    function JitsiMeetExternalAPI(domain, room_name, width, height, parentNode,
        configOverwrite, interfaceConfigOverwrite) {
        if (!width || width < MIN_WIDTH)
            width = MIN_WIDTH;
        if (!height || height < MIN_HEIGHT)
            height = MIN_HEIGHT;

        this.parentNode = null;
        if (parentNode) {
            this.parentNode = parentNode;
        } else {
            var scriptTag = document.scripts[document.scripts.length - 1];
            this.parentNode = scriptTag.parentNode;
        }

        this.iframeHolder =
            this.parentNode.appendChild(document.createElement("div"));
        this.iframeHolder.id = "jitsiConference" + JitsiMeetExternalAPI.id;
        if(width)
            this.iframeHolder.style.width = width + "px";
        if(height)
            this.iframeHolder.style.height = height + "px";
        this.frameName = "jitsiConferenceFrame" + JitsiMeetExternalAPI.id;
        this.url = "https://" + domain + "/";
        if(room_name)
            this.url += room_name;
        this.url += "#external=true";

        var key;
        if (configOverwrite) {
            for (key in configOverwrite) {
                if (!configOverwrite.hasOwnProperty(key) ||
                    typeof key !== 'string')
                    continue;
                this.url += "&config." + key + "=" + configOverwrite[key];
            }
        }

        if (interfaceConfigOverwrite) {
            for (key in interfaceConfigOverwrite) {
                if (!interfaceConfigOverwrite.hasOwnProperty(key) ||
                    typeof key !== 'string')
                    continue;
                this.url += "&interfaceConfig." + key + "=" +
                    interfaceConfigOverwrite[key];
            }
        }

        JitsiMeetExternalAPI.id++;

        this.frame = document.createElement("iframe");
        this.frame.src = this.url;
        this.frame.name = this.frameName;
        this.frame.id = this.frameName;
        this.frame.width = "100%";
        this.frame.height = "100%";
        this.frame.setAttribute("allowFullScreen","true");
        this.frame = this.iframeHolder.appendChild(this.frame);


        this.frameLoaded = false;
        this.initialCommands = [];
        this.eventHandlers = {};
        this.initListeners();
    }

    /**
     * Last id of api object
     * @type {number}
     */
    JitsiMeetExternalAPI.id = 0;

    /**
     * Sends the passed object to Jitsi Meet
     * @param object the object to be sent
     */
    JitsiMeetExternalAPI.prototype.sendMessage = function(object) {
        if (this.frameLoaded) {
            this.frame.contentWindow.postMessage(
                JSON.stringify(object), this.frame.src);
        }
        else {
            this.initialCommands.push(object);
        }

    };

    /**
     * Executes command. The available commands are:
     * displayName - sets the display name of the local participant to the value
     * passed in the arguments array.
     * toggleAudio - mutes / unmutes audio with no arguments
     * toggleVideo - mutes / unmutes video with no arguments
     * filmStrip - hides / shows the film strip with no arguments
     * If the command doesn't require any arguments the parameter should be set
     * to empty array or it may be omitted.
     * @param name the name of the command
     * @param arguments array of arguments
     */
    JitsiMeetExternalAPI.prototype.executeCommand = function(name,
                                                             argumentsList) {
        var argumentsArray = argumentsList;
        if (!argumentsArray)
            argumentsArray = [];
        var object = {type: "command", action: "execute"};
        object[name] = argumentsArray;
        this.sendMessage(object);
    };

    /**
     * Executes commands. The available commands are:
     * displayName - sets the display name of the local participant to the value
     * passed in the arguments array.
     * toggleAudio - mutes / unmutes audio with no arguments
     * toggleVideo - mutes / unmutes video with no arguments
     * filmStrip - hides / shows the film strip with no arguments
     * @param object the object with commands to be executed. The keys of the
     * object are the commands that will be executed and the values are the
     * arguments for the command.
     */
    JitsiMeetExternalAPI.prototype.executeCommands = function (object) {
        object.type = "command";
        object.action = "execute";
        this.sendMessage(object);
    };

    /**
     * Adds event listeners to Meet Jitsi. The object key should be the name of
     * the event and value - the listener.
     * Currently we support the following
     * events:
     * incomingMessage - receives event notifications about incoming
     * messages. The listener will receive object with the following structure:
     * {{
     *  "from": from,//JID of the user that sent the message
     *  "nick": nick,//the nickname of the user that sent the message
     *  "message": txt//the text of the message
     * }}
     * outgoingMessage - receives event notifications about outgoing
     * messages. The listener will receive object with the following structure:
     * {{
     *  "message": txt//the text of the message
     * }}
     * displayNameChanged - receives event notifications about display name
     * change. The listener will receive object with the following structure:
     * {{
     * jid: jid,//the JID of the participant that changed his display name
     * displayname: displayName //the new display name
     * }}
     * participantJoined - receives event notifications about new participant.
     * The listener will receive object with the following structure:
     * {{
     * jid: jid //the jid of the participant
     * }}
     * participantLeft - receives event notifications about the participant that
     * left the room.
     * The listener will receive object with the following structure:
     * {{
     * jid: jid //the jid of the participant
     * }}
     * @param object
     */
    JitsiMeetExternalAPI.prototype.addEventListeners
        = function (object) {

        var message = {type: "event", action: "add", events: []};
        for(var i in object)
        {
            message.events.push(i);
            this.eventHandlers[i] = object[i];
        }
        this.sendMessage(message);
    };

    /**
     * Adds event listeners to Meet Jitsi. Currently we support the following
     * events:
     * incomingMessage - receives event notifications about incoming
     * messages. The listener will receive object with the following structure:
     * {{
     *  "from": from,//JID of the user that sent the message
     *  "nick": nick,//the nickname of the user that sent the message
     *  "message": txt//the text of the message
     * }}
     * outgoingMessage - receives event notifications about outgoing
     * messages. The listener will receive object with the following structure:
     * {{
     *  "message": txt//the text of the message
     * }}
     * displayNameChanged - receives event notifications about display name
     * change. The listener will receive object with the following structure:
     * {{
     * jid: jid,//the JID of the participant that changed his display name
     * displayname: displayName //the new display name
     * }}
     * participantJoined - receives event notifications about new participant.
     * The listener will receive object with the following structure:
     * {{
     * jid: jid //the jid of the participant
     * }}
     * participantLeft - receives event notifications about participant the that
     * left the room.
     * The listener will receive object with the following structure:
     * {{
     * jid: jid //the jid of the participant
     * }}
     * @param event the name of the event
     * @param listener the listener
     */
    JitsiMeetExternalAPI.prototype.addEventListener
        = function (event, listener) {

        var message = {type: "event", action: "add", events: [event]};
        this.eventHandlers[event] = listener;
        this.sendMessage(message);
    };

    /**
     * Removes event listener.
     * @param event the name of the event.
     */
    JitsiMeetExternalAPI.prototype.removeEventListener
        = function (event) {
        if(!this.eventHandlers[event])
        {
            console.error("The event " + event + " is not registered.");
            return;
        }
        var message = {type: "event", action: "remove", events: [event]};
        delete this.eventHandlers[event];
        this.sendMessage(message);
    };

    /**
     * Removes event listeners.
     * @param events array with the names of the events.
     */
    JitsiMeetExternalAPI.prototype.removeEventListeners
        = function (events) {
        var eventsArray = [];
        for(var i = 0; i < events.length; i++)
        {
            var event = events[i];
            if(!this.eventHandlers[event])
            {
                console.error("The event " + event + " is not registered.");
                continue;
            }
            delete this.eventHandlers[event];
            eventsArray.push(event);
        }

        if(eventsArray.length > 0)
        {
            this.sendMessage(
                {type: "event", action: "remove", events: eventsArray});
        }

    };

    /**
     * Processes message events sent from Jitsi Meet
     * @param event the event
     */
    JitsiMeetExternalAPI.prototype.processMessage = function(event) {
        var message;
        try {
            message = JSON.parse(event.data);
        } catch (e) {}

        if(!message.type) {
            console.error("Message without type is received.");
            return;
        }
        switch (message.type) {
            case "system":
                if(message.loaded) {
                    this.onFrameLoaded();
                }
                break;
            case "event":
                if(message.action != "result" ||
                    !message.event || !this.eventHandlers[message.event]) {
                    console.warn("The received event cannot be parsed.");
                    return;
                }
                this.eventHandlers[message.event](message.result);
                break;
            default :
                console.error("Unknown message type.");
                return;
        }
    };

    /**
     * That method is called when the Jitsi Meet is loaded. Executes saved
     * commands that are send before the frame was loaded.
     */
    JitsiMeetExternalAPI.prototype.onFrameLoaded = function () {
        this.frameLoaded = true;
        for (var i = 0; i < this.initialCommands.length; i++) {
            this.sendMessage(this.initialCommands[i]);
        }
        this.initialCommands = null;
    };

    /**
     * Setups the listener for message events from Jitsi Meet.
     */
    JitsiMeetExternalAPI.prototype.initListeners = function () {
        var self = this;
        this.eventListener = function (event) {
            self.processMessage(event);
        };
        if (window.addEventListener) {
            window.addEventListener('message',
                this.eventListener, false);
        }
        else {
            window.attachEvent('onmessage', this.eventListener);
        }
    };

    /**
     * Removes the listeners and removes the Jitsi Meet frame.
     */
    JitsiMeetExternalAPI.prototype.dispose = function () {
        if (window.removeEventListener) {
            window.removeEventListener('message',
                this.eventListener, false);
        }
        else {
            window.detachEvent('onmessage',
                this.eventListener);
        }
        var frame = document.getElementById(this.frameName);
        if(frame)
            frame.src = 'about:blank';
        var self = this;
        window.setTimeout(function () {
                self.iframeHolder.removeChild(self.frame);
                self.iframeHolder.parentNode.removeChild(self.iframeHolder);
        }, 10);
    };

    return JitsiMeetExternalAPI;

})();
