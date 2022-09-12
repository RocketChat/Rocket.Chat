module.export({stripTcpCandidates:()=>stripTcpCandidates,stripTelephoneEvent:()=>stripTelephoneEvent,cleanJitsiSdpImageattr:()=>cleanJitsiSdpImageattr,stripG722:()=>stripG722,stripRtpPayload:()=>stripRtpPayload,stripVideo:()=>stripVideo,addMidLines:()=>addMidLines,holdModifier:()=>holdModifier});const stripPayload = (sdp, payload) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mediaDescs = [];
    const lines = sdp.split(/\r\n/);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentMediaDesc;
    for (let i = 0; i < lines.length;) {
        const line = lines[i];
        if (/^m=(?:audio|video)/.test(line)) {
            currentMediaDesc = {
                index: i,
                stripped: []
            };
            mediaDescs.push(currentMediaDesc);
        }
        else if (currentMediaDesc) {
            const rtpmap = /^a=rtpmap:(\d+) ([^/]+)\//.exec(line);
            if (rtpmap && payload === rtpmap[2]) {
                lines.splice(i, 1);
                currentMediaDesc.stripped.push(rtpmap[1]);
                continue; // Don't increment 'i'
            }
        }
        i++;
    }
    for (const mediaDesc of mediaDescs) {
        const mline = lines[mediaDesc.index].split(" ");
        // Ignore the first 3 parameters of the mline. The codec information is after that
        for (let j = 3; j < mline.length;) {
            if (mediaDesc.stripped.indexOf(mline[j]) !== -1) {
                mline.splice(j, 1);
                continue;
            }
            j++;
        }
        lines[mediaDesc.index] = mline.join(" ");
    }
    return lines.join("\r\n");
};
const stripMediaDescription = (sdp, description) => {
    const descriptionRegExp = new RegExp("m=" + description + ".*$", "gm");
    const groupRegExp = new RegExp("^a=group:.*$", "gm");
    if (descriptionRegExp.test(sdp)) {
        let midLineToRemove;
        sdp = sdp.split(/^m=/gm).filter((section) => {
            if (section.substr(0, description.length) === description) {
                midLineToRemove = section.match(/^a=mid:.*$/gm);
                if (midLineToRemove) {
                    const step = midLineToRemove[0].match(/:.+$/g);
                    if (step) {
                        midLineToRemove = step[0].substr(1);
                    }
                }
                return false;
            }
            return true;
        }).join("m=");
        const groupLine = sdp.match(groupRegExp);
        if (groupLine && groupLine.length === 1) {
            let groupLinePortion = groupLine[0];
            // eslint-disable-next-line no-useless-escape
            const groupRegExpReplace = new RegExp("\ *" + midLineToRemove + "[^\ ]*", "g");
            groupLinePortion = groupLinePortion.replace(groupRegExpReplace, "");
            sdp = sdp.split(groupRegExp).join(groupLinePortion);
        }
    }
    return sdp;
};
/**
 * Modifier.
 * @public
 */
function stripTcpCandidates(description) {
    description.sdp = (description.sdp || "").replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, "");
    return Promise.resolve(description);
}
/**
 * Modifier.
 * @public
 */
function stripTelephoneEvent(description) {
    description.sdp = stripPayload(description.sdp || "", "telephone-event");
    return Promise.resolve(description);
}
/**
 * Modifier.
 * @public
 */
function cleanJitsiSdpImageattr(description) {
    description.sdp = (description.sdp || "").replace(/^(a=imageattr:.*?)(x|y)=\[0-/gm, "$1$2=[1:");
    return Promise.resolve(description);
}
/**
 * Modifier.
 * @public
 */
function stripG722(description) {
    description.sdp = stripPayload(description.sdp || "", "G722");
    return Promise.resolve(description);
}
/**
 * Modifier.
 * @public
 */
function stripRtpPayload(payload) {
    return (description) => {
        description.sdp = stripPayload(description.sdp || "", payload);
        return Promise.resolve(description);
    };
}
/**
 * Modifier.
 * @public
 */
function stripVideo(description) {
    description.sdp = stripMediaDescription(description.sdp || "", "video");
    return Promise.resolve(description);
}
/**
 * Modifier.
 * @public
 */
function addMidLines(description) {
    let sdp = description.sdp || "";
    if (sdp.search(/^a=mid.*$/gm) === -1) {
        const mlines = sdp.match(/^m=.*$/gm);
        const sdpArray = sdp.split(/^m=.*$/gm);
        if (mlines) {
            mlines.forEach((elem, idx) => {
                mlines[idx] = elem + "\na=mid:" + idx;
            });
        }
        sdpArray.forEach((elem, idx) => {
            if (mlines && mlines[idx]) {
                sdpArray[idx] = elem + mlines[idx];
            }
        });
        sdp = sdpArray.join("");
        description.sdp = sdp;
    }
    return Promise.resolve(description);
}
/**
 * The modifier that should be used when the session would like to place the call on hold.
 * @param description - The description that will be modified.
 */
function holdModifier(description) {
    if (!description.sdp || !description.type) {
        throw new Error("Invalid SDP");
    }
    let sdp = description.sdp;
    const type = description.type;
    if (sdp) {
        if (!/a=(sendrecv|sendonly|recvonly|inactive)/.test(sdp)) {
            sdp = sdp.replace(/(m=[^\r]*\r\n)/g, "$1a=sendonly\r\n");
        }
        else {
            sdp = sdp.replace(/a=sendrecv\r\n/g, "a=sendonly\r\n");
            sdp = sdp.replace(/a=recvonly\r\n/g, "a=inactive\r\n");
        }
    }
    return Promise.resolve({ sdp, type });
}
