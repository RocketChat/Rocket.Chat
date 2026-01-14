export const schemas = {
    version: "3.0",
    components: {
        schemas: {
            IMessage: {
                type: "object",
                properties: {
                    rid: {
                        type: "string"
                    },
                    msg: {
                        type: "string"
                    },
                    tmid: {
                        type: "string"
                    },
                    tshow: {
                        type: "boolean"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    mentions: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/MessageMention"
                        }
                    },
                    groupable: {
                        type: "boolean"
                    },
                    channels: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/PickIRoom_idname"
                        }
                    },
                    u: {
                        $ref: "#/components/schemas/RequiredPickIUser_idusernamePickIUsername"
                    },
                    blocks: {
                        $ref: "#/components/schemas/MessageSurfaceLayout"
                    },
                    alias: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    _hidden: {
                        type: "boolean"
                    },
                    imported: {
                        type: "boolean"
                    },
                    replies: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    location: {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                "enum": [
                                    "Point"
                                ]
                            },
                            coordinates: {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            type: "number"
                                        },
                                        {
                                            type: "number"
                                        }
                                    ]
                                },
                                minItems: 2,
                                maxItems: 2
                            }
                        },
                        required: [
                            "type",
                            "coordinates"
                        ]
                    },
                    starred: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                _id: {
                                    type: "string"
                                }
                            },
                            required: [
                                "_id"
                            ]
                        }
                    },
                    pinned: {
                        type: "boolean"
                    },
                    pinnedAt: {
                        type: "string",
                        format: "date-time"
                    },
                    pinnedBy: {
                        $ref: "#/components/schemas/PickIUser_idusername"
                    },
                    unread: {
                        type: "boolean"
                    },
                    temp: {
                        type: "boolean"
                    },
                    drid: {
                        type: "string"
                    },
                    tlm: {
                        type: "string",
                        format: "date-time"
                    },
                    dcount: {
                        type: "number"
                    },
                    tcount: {
                        type: "number"
                    },
                    t: {
                        type: "string",
                        "enum": [
                            "e2e",
                            "uj",
                            "ui",
                            "uir",
                            "ul",
                            "ru",
                            "au",
                            "mute_unmute",
                            "r",
                            "ut",
                            "wm",
                            "rm",
                            "subscription-role-added",
                            "subscription-role-removed",
                            "room-archived",
                            "room-unarchived",
                            "room_changed_privacy",
                            "room_changed_description",
                            "room_changed_announcement",
                            "room_changed_avatar",
                            "room_changed_topic",
                            "room_e2e_enabled",
                            "room_e2e_disabled",
                            "user-muted",
                            "user-unmuted",
                            "room-removed-read-only",
                            "room-set-read-only",
                            "room-allowed-reacting",
                            "room-disallowed-reacting",
                            "command",
                            "videoconf",
                            "message_pinned",
                            "message_pinned_e2e",
                            "new-moderator",
                            "moderator-removed",
                            "new-owner",
                            "owner-removed",
                            "new-leader",
                            "leader-removed",
                            "discussion-created",
                            "abac-removed-user-from-room",
                            "removed-user-from-team",
                            "added-user-to-team",
                            "ult",
                            "user-converted-to-team",
                            "user-converted-to-channel",
                            "user-removed-room-from-team",
                            "user-deleted-room-from-team",
                            "user-added-room-to-team",
                            "ujt",
                            "livechat_navigation_history",
                            "livechat_transfer_history",
                            "livechat_transcript_history",
                            "livechat_video_call",
                            "livechat_transfer_history_fallback",
                            "livechat-close",
                            "livechat-started",
                            "omnichannel_priority_change_history",
                            "omnichannel_sla_change_history",
                            "omnichannel_placed_chat_on_hold",
                            "omnichannel_on_hold_chat_resumed"
                        ]
                    },
                    e2e: {
                        type: "string",
                        "enum": [
                            "pending",
                            "done"
                        ]
                    },
                    e2eMentions: {
                        type: "object",
                        properties: {
                            e2eUserMentions: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            },
                            e2eChannelMentions: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            }
                        },
                        required: []
                    },
                    urls: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/MessageUrl"
                        }
                    },
                    actionLinks: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                icon: {
                                    type: "string",
                                    "enum": [
                                        "file",
                                        "sort",
                                        "at",
                                        "cloud",
                                        "google",
                                        "facebook",
                                        "github",
                                        "linkedin",
                                        "twitter",
                                        "gitlab",
                                        "language",
                                        "phone",
                                        "sms",
                                        "user",
                                        "omnichannel",
                                        "hash",
                                        "code",
                                        "bold",
                                        "italic",
                                        "strike",
                                        "link",
                                        "team",
                                        "address-book",
                                        "ai",
                                        "airplane",
                                        "arrow-back",
                                        "arrow-back-up",
                                        "arrow-collapse",
                                        "arrow-down",
                                        "arrow-down-box",
                                        "arrow-down-left",
                                        "arrow-expand",
                                        "arrow-fall",
                                        "arrow-forward",
                                        "arrow-jump",
                                        "arrow-loop",
                                        "arrow-return",
                                        "arrow-rise",
                                        "arrow-stack-up",
                                        "arrow-up",
                                        "arrow-up-box",
                                        "arrow-up-right",
                                        "attachment-file",
                                        "avatar",
                                        "backspace",
                                        "bag",
                                        "ball",
                                        "balloon",
                                        "balloon-arrow-left",
                                        "balloon-arrow-top-right",
                                        "balloon-close-top-right",
                                        "balloon-ellipsis",
                                        "balloon-exclamation",
                                        "balloon-off",
                                        "balloons",
                                        "balloon-text",
                                        "ban",
                                        "bell",
                                        "bell-off",
                                        "book",
                                        "brush",
                                        "burger",
                                        "burger-arrow-left",
                                        "burger-menu",
                                        "business",
                                        "calendar",
                                        "camera",
                                        "card",
                                        "check",
                                        "check-double",
                                        "check-single",
                                        "chevron-double-down",
                                        "chevron-double-up",
                                        "chevron-down",
                                        "chevron-expand",
                                        "chevron-left",
                                        "chevron-right",
                                        "chevron-up",
                                        "circle-arrow-down",
                                        "circle-check",
                                        "circle-cross",
                                        "circle-exclamation",
                                        "circle-half",
                                        "circle-quarter",
                                        "circle-three-quarters",
                                        "circle-unfilled",
                                        "circle-unfilled-large",
                                        "circle-unfilled-small",
                                        "clip",
                                        "clipboard",
                                        "clock",
                                        "cloud-arrow-down",
                                        "cloud-arrow-up",
                                        "cloud-plus",
                                        "code-block",
                                        "cog",
                                        "compass",
                                        "condensed-view",
                                        "copy",
                                        "crop",
                                        "cross",
                                        "cross-small",
                                        "cube",
                                        "customize",
                                        "dashboard",
                                        "desktop",
                                        "desktop-text",
                                        "dialpad",
                                        "doc",
                                        "document-eye",
                                        "doner",
                                        "emoji",
                                        "emoji-neutral",
                                        "emoji-plus",
                                        "equal",
                                        "eraser",
                                        "error-circle",
                                        "exit",
                                        "extended-view",
                                        "eye",
                                        "eye-off",
                                        "fingerprint",
                                        "flag",
                                        "flask",
                                        "folder",
                                        "formula",
                                        "globe",
                                        "globe-cross",
                                        "globe-off",
                                        "group-by-type",
                                        "hash-shield",
                                        "hashtag-lock",
                                        "h-bar",
                                        "headphone",
                                        "headphone-off",
                                        "headset",
                                        "help",
                                        "history",
                                        "home",
                                        "image",
                                        "inbox",
                                        "info",
                                        "joystick",
                                        "kebab",
                                        "key",
                                        "keyboard",
                                        "lamp-bulb",
                                        "leaf",
                                        "lightning",
                                        "list-bullets",
                                        "list-numbers",
                                        "live",
                                        "lock",
                                        "login",
                                        "magnifier",
                                        "mail",
                                        "mail-arrow-top-right",
                                        "meatballs",
                                        "medium-view",
                                        "members",
                                        "mic",
                                        "mic-off",
                                        "mobile",
                                        "mobile-check",
                                        "mobile-exclamation",
                                        "moon",
                                        "musical-note",
                                        "new-window",
                                        "notebook-hashtag",
                                        "notebook-hashtag-crossed",
                                        "pause",
                                        "pause-shape-filled",
                                        "pause-shape-unfilled",
                                        "pause-unfilled",
                                        "pencil",
                                        "pencil-box",
                                        "percentage",
                                        "person-arms-spread",
                                        "phone-disabled",
                                        "phone-in",
                                        "phone-issue",
                                        "phone-off",
                                        "phone-out",
                                        "phone-plus",
                                        "phone-question-mark",
                                        "pin",
                                        "pin-map",
                                        "play",
                                        "play-shape-filled",
                                        "play-unfilled",
                                        "plus",
                                        "plus-small",
                                        "podcast",
                                        "question-mark",
                                        "quote",
                                        "rec",
                                        "refresh",
                                        "rocket",
                                        "send",
                                        "send-filled",
                                        "share-alt",
                                        "sheet",
                                        "shield",
                                        "shield-blank",
                                        "shield-check",
                                        "signal",
                                        "smart",
                                        "sort-az",
                                        "spanner",
                                        "squares",
                                        "stack",
                                        "stacked-meatballs",
                                        "star",
                                        "star-filled",
                                        "stars",
                                        "stop",
                                        "stop-unfilled",
                                        "stopwatch",
                                        "store",
                                        "success-circle",
                                        "sun",
                                        "tag",
                                        "team-arrow-right",
                                        "team-lock",
                                        "team-shield",
                                        "text-decrease",
                                        "text-increase",
                                        "trash",
                                        "underline",
                                        "undo",
                                        "user-arrow-right",
                                        "user-lock",
                                        "user-plus",
                                        "video",
                                        "video-disabled",
                                        "video-filled",
                                        "video-message",
                                        "video-off",
                                        "volume",
                                        "volume-disabled",
                                        "volume-lock",
                                        "volume-off",
                                        "warning",
                                        "zip",
                                        "add-reaction",
                                        "add-user",
                                        "attachment",
                                        "audio",
                                        "back",
                                        "baloon-arrow-left",
                                        "baloon-arrow-top-right",
                                        "baloon-close-top-right",
                                        "baloon-ellipsis",
                                        "baloon-exclamation",
                                        "baloons",
                                        "baloon-text",
                                        "cancel",
                                        "canned-response",
                                        "chat",
                                        "checkmark-circled",
                                        "circled-arrow-down",
                                        "computer",
                                        "contact",
                                        "discover",
                                        "discussion",
                                        "download",
                                        "edit",
                                        "edit-rounded",
                                        "file-document",
                                        "file-generic",
                                        "file-google-drive",
                                        "file-pdf",
                                        "files-audio",
                                        "file-sheets",
                                        "files-video",
                                        "files-zip",
                                        "game",
                                        "hashtag",
                                        "import",
                                        "info-circled",
                                        "jump",
                                        "jump-to-message",
                                        "katex",
                                        "map-pin",
                                        "menu",
                                        "message",
                                        "message-disabled",
                                        "modal-warning",
                                        "multiline",
                                        "palette",
                                        "permalink",
                                        "post",
                                        "queue",
                                        "reload",
                                        "reply-directly",
                                        "report",
                                        "send-active",
                                        "share",
                                        "shield-alt",
                                        "sign-out",
                                        "sort-amount-down",
                                        "th-list",
                                        "thread",
                                        "upload",
                                        "user-rounded",
                                        "circle",
                                        "file-keynote",
                                        "hand-pointer",
                                        "list",
                                        "list-alt",
                                        "livechat",
                                        "loading",
                                        "play-solid",
                                        "reply",
                                        "adobe",
                                        "google-drive",
                                        "hubot",
                                        "rocketchat"
                                    ]
                                },
                                i18nLabel: {},
                                label: {
                                    type: "string"
                                },
                                method_id: {
                                    type: "string"
                                },
                                params: {
                                    type: "string"
                                }
                            },
                            required: [
                                "icon",
                                "i18nLabel",
                                "label",
                                "method_id",
                                "params"
                            ]
                        },
                        deprecated: true
                    },
                    file: {
                        $ref: "#/components/schemas/FileProp",
                        deprecated: true
                    },
                    fileUpload: {
                        type: "object",
                        properties: {
                            publicFilePath: {
                                type: "string"
                            },
                            type: {
                                type: "string"
                            },
                            size: {
                                type: "number"
                            }
                        },
                        required: [
                            "publicFilePath"
                        ]
                    },
                    files: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/FileProp"
                        }
                    },
                    attachments: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/MessageAttachment"
                        }
                    },
                    reactions: {
                        type: "object",
                        properties: {},
                        required: [],
                        additionalProperties: {
                            type: "object",
                            properties: {
                                names: {
                                    type: "array",
                                    items: {
                                        type: "string"
                                    }
                                },
                                usernames: {
                                    type: "array",
                                    items: {
                                        type: "string"
                                    }
                                },
                                federationReactionEventIds: {
                                    $ref: "#/components/schemas/Recordstringstring"
                                }
                            },
                            required: [
                                "usernames"
                            ]
                        }
                    },
                    "private": {
                        type: "boolean"
                    },
                    bot: {
                        $ref: "#/components/schemas/Recordstringany"
                    },
                    sentByEmail: {
                        type: "boolean"
                    },
                    webRtcCallEndTs: {
                        type: "string",
                        format: "date-time"
                    },
                    role: {
                        type: "string"
                    },
                    avatar: {
                        type: "string"
                    },
                    emoji: {
                        type: "string"
                    },
                    tokens: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Token"
                        }
                    },
                    html: {
                        type: "string"
                    },
                    token: {
                        type: "string"
                    },
                    federation: {
                        type: "object",
                        properties: {
                            eventId: {
                                type: "string"
                            },
                            version: {
                                type: "number"
                            }
                        },
                        required: [
                            "eventId"
                        ]
                    },
                    slaData: {
                        type: "object",
                        properties: {
                            definedBy: {
                                $ref: "#/components/schemas/PickIUser_idusername"
                            },
                            sla: {
                                $ref: "#/components/schemas/PickIOmnichannelServiceLevelAgreementsname"
                            }
                        },
                        required: [
                            "definedBy"
                        ]
                    },
                    priorityData: {
                        type: "object",
                        properties: {
                            definedBy: {
                                $ref: "#/components/schemas/PickIUser_idusername"
                            },
                            priority: {
                                $ref: "#/components/schemas/PickILivechatPrioritynamei18n"
                            }
                        },
                        required: [
                            "definedBy"
                        ]
                    },
                    customFields: {
                        $ref: "#/components/schemas/IMessageCustomFields"
                    },
                    content: {
                        oneOf: [
                            {
                                $ref: "#/components/schemas/IEncryptedContentV1"
                            },
                            {
                                $ref: "#/components/schemas/IEncryptedContentV2"
                            },
                            {
                                $ref: "#/components/schemas/IEncryptedContentFederation"
                            }
                        ]
                    },
                    _id: {
                        type: "string"
                    },
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    }
                },
                required: [
                    "rid",
                    "msg",
                    "ts",
                    "u",
                    "_id",
                    "_updatedAt"
                ]
            },
            MessageMention: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "user",
                            "team"
                        ]
                    },
                    _id: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                    username: {
                        type: "string"
                    },
                    fname: {
                        type: "string"
                    }
                },
                required: [
                    "_id"
                ]
            },
            PickIRoom_idname: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    }
                },
                required: [
                    "_id"
                ],
                description: "From T, pick a set of properties whose keys are in the union K"
            },
            RequiredPickIUser_idusernamePickIUsername: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    username: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    }
                },
                required: [
                    "_id",
                    "username"
                ]
            },
            MessageSurfaceLayout: {
                type: "array",
                items: {
                    $ref: "#/components/schemas/MessageSurfaceLayoutBlock"
                }
            },
            MessageSurfaceLayoutBlock: {
                oneOf: [
                    {
                        $ref: "#/components/schemas/ContextBlock"
                    },
                    {
                        $ref: "#/components/schemas/DividerBlock"
                    },
                    {
                        $ref: "#/components/schemas/ImageBlock"
                    },
                    {
                        $ref: "#/components/schemas/SectionBlock"
                    },
                    {
                        $ref: "#/components/schemas/CalloutBlock"
                    },
                    {
                        $ref: "#/components/schemas/ActionsBlock"
                    },
                    {
                        $ref: "#/components/schemas/VideoConferenceBlock"
                    },
                    {
                        $ref: "#/components/schemas/PreviewBlockBase"
                    },
                    {
                        $ref: "#/components/schemas/PreviewBlockWithThumb"
                    },
                    {
                        $ref: "#/components/schemas/PreviewBlockWithPreview"
                    },
                    {
                        $ref: "#/components/schemas/InfoCardBlock"
                    }
                ]
            },
            ContextBlock: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "context"
                        ]
                    },
                    elements: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/ContextBlockElements"
                        }
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "elements"
                ]
            },
            ContextBlockElements: {
                oneOf: [
                    {
                        $ref: "#/components/schemas/PlainText"
                    },
                    {
                        $ref: "#/components/schemas/Markdown"
                    },
                    {
                        $ref: "#/components/schemas/ImageElement"
                    }
                ]
            },
            PlainText: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "plain_text"
                        ]
                    },
                    text: {
                        type: "string"
                    },
                    emoji: {
                        type: "boolean"
                    },
                    i18n: {
                        type: "object",
                        properties: {
                            key: {
                                type: "string"
                            },
                            args: {
                                type: "object",
                                properties: {},
                                required: [],
                                additionalProperties: {
                                    oneOf: [
                                        {
                                            type: "string"
                                        },
                                        {
                                            type: "number"
                                        }
                                    ]
                                }
                            }
                        },
                        required: [
                            "key"
                        ]
                    }
                },
                required: [
                    "type",
                    "text"
                ]
            },
            Markdown: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "mrkdwn"
                        ]
                    },
                    text: {
                        type: "string"
                    },
                    verbatim: {
                        type: "boolean"
                    },
                    i18n: {
                        type: "object",
                        properties: {
                            key: {
                                type: "string"
                            },
                            args: {
                                type: "object",
                                properties: {},
                                required: [],
                                additionalProperties: {
                                    oneOf: [
                                        {
                                            type: "string"
                                        },
                                        {
                                            type: "number"
                                        }
                                    ]
                                }
                            }
                        },
                        required: [
                            "key"
                        ]
                    }
                },
                required: [
                    "type",
                    "text"
                ]
            },
            ImageElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "image"
                        ]
                    },
                    imageUrl: {
                        type: "string"
                    },
                    altText: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "imageUrl",
                    "altText"
                ]
            },
            DividerBlock: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "divider"
                        ]
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type"
                ]
            },
            ImageBlock: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "image"
                        ]
                    },
                    imageUrl: {
                        type: "string"
                    },
                    altText: {
                        type: "string"
                    },
                    title: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "imageUrl",
                    "altText"
                ]
            },
            SectionBlock: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "section"
                        ]
                    },
                    text: {
                        oneOf: [
                            {
                                $ref: "#/components/schemas/PlainText"
                            },
                            {
                                $ref: "#/components/schemas/Markdown"
                            }
                        ]
                    },
                    fields: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/TextObject"
                        }
                    },
                    accessory: {
                        oneOf: [
                            {
                                $ref: "#/components/schemas/ImageElement"
                            },
                            {
                                $ref: "#/components/schemas/ButtonElement"
                            },
                            {
                                $ref: "#/components/schemas/DatePickerElement"
                            },
                            {
                                $ref: "#/components/schemas/MultiStaticSelectElement"
                            },
                            {
                                $ref: "#/components/schemas/OverflowElement"
                            },
                            {
                                $ref: "#/components/schemas/StaticSelectElement"
                            }
                        ]
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type"
                ]
            },
            TextObject: {
                oneOf: [
                    {
                        $ref: "#/components/schemas/PlainText"
                    },
                    {
                        $ref: "#/components/schemas/Markdown"
                    }
                ]
            },
            ButtonElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "button"
                        ]
                    },
                    text: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    url: {
                        type: "string"
                    },
                    value: {
                        type: "string"
                    },
                    style: {
                        type: "string",
                        "enum": [
                            "danger",
                            "warning",
                            "primary",
                            "secondary",
                            "success"
                        ]
                    },
                    secondary: {
                        type: "boolean"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "text",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            ConfirmationDialog: {
                type: "object",
                properties: {
                    title: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    text: {
                        $ref: "#/components/schemas/TextObject"
                    },
                    confirm: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    deny: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    style: {
                        type: "string",
                        "enum": [
                            "danger",
                            "primary"
                        ]
                    }
                },
                required: [
                    "title",
                    "text",
                    "confirm",
                    "deny",
                    "style"
                ]
            },
            InputElementDispatchAction: {
                type: "string",
                "enum": [
                    "on_character_entered",
                    "on_item_selected"
                ]
            },
            DatePickerElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "datepicker"
                        ]
                    },
                    placeholder: {
                        oneOf: [
                            {
                                $ref: "#/components/schemas/PlainText"
                            },
                            {
                                $ref: "#/components/schemas/Markdown"
                            }
                        ]
                    },
                    initialDate: {
                        type: "string"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            MultiStaticSelectElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "multi_static_select"
                        ]
                    },
                    placeholder: {
                        $ref: "#/components/schemas/TextObject"
                    },
                    options: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    optionGroups: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/OptionGroup"
                        }
                    },
                    maxSelectItems: {
                        type: "number"
                    },
                    initialValue: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    initialOption: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "placeholder",
                    "options",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            Option: {
                type: "object",
                properties: {
                    text: {
                        $ref: "#/components/schemas/TextObject"
                    },
                    value: {
                        type: "string"
                    },
                    description: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    url: {
                        type: "string"
                    }
                },
                required: [
                    "text",
                    "value"
                ]
            },
            OptionGroup: {
                type: "object",
                properties: {
                    label: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    options: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    }
                },
                required: [
                    "label",
                    "options"
                ]
            },
            OverflowElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "overflow"
                        ]
                    },
                    options: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "options",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            StaticSelectElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "static_select"
                        ]
                    },
                    placeholder: {
                        $ref: "#/components/schemas/TextObject"
                    },
                    options: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    optionGroups: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/OptionGroup"
                        }
                    },
                    initialOption: {
                        $ref: "#/components/schemas/Option"
                    },
                    initialValue: {
                        type: "string"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "placeholder",
                    "options",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            CalloutBlock: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "callout"
                        ]
                    },
                    title: {
                        oneOf: [
                            {
                                $ref: "#/components/schemas/PlainText"
                            },
                            {
                                $ref: "#/components/schemas/Markdown"
                            }
                        ]
                    },
                    text: {
                        $ref: "#/components/schemas/TextObject"
                    },
                    variant: {
                        type: "string",
                        "enum": [
                            "danger",
                            "info",
                            "warning",
                            "success"
                        ]
                    },
                    accessory: {
                        oneOf: [
                            {
                                $ref: "#/components/schemas/ButtonElement"
                            },
                            {
                                $ref: "#/components/schemas/OverflowElement"
                            }
                        ]
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "text"
                ]
            },
            ActionsBlock: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "actions"
                        ]
                    },
                    elements: {
                        type: "array",
                        items: {
                            oneOf: [
                                {
                                    $ref: "#/components/schemas/ButtonElement"
                                },
                                {
                                    $ref: "#/components/schemas/DatePickerElement"
                                },
                                {
                                    $ref: "#/components/schemas/MultiStaticSelectElement"
                                },
                                {
                                    $ref: "#/components/schemas/OverflowElement"
                                },
                                {
                                    $ref: "#/components/schemas/StaticSelectElement"
                                },
                                {
                                    $ref: "#/components/schemas/ChannelsSelectElement"
                                },
                                {
                                    $ref: "#/components/schemas/ConversationsSelectElement"
                                },
                                {
                                    $ref: "#/components/schemas/LinearScaleElement"
                                },
                                {
                                    $ref: "#/components/schemas/MultiChannelsSelectElement"
                                },
                                {
                                    $ref: "#/components/schemas/MultiConversationsSelectElement"
                                },
                                {
                                    $ref: "#/components/schemas/MultiUsersSelectElement"
                                },
                                {
                                    $ref: "#/components/schemas/UsersSelectElement"
                                },
                                {
                                    $ref: "#/components/schemas/ToggleSwitchElement"
                                },
                                {
                                    $ref: "#/components/schemas/CheckboxElement"
                                },
                                {
                                    $ref: "#/components/schemas/RadioButtonElement"
                                },
                                {
                                    $ref: "#/components/schemas/TimePickerElement"
                                }
                            ]
                        }
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "elements"
                ]
            },
            ChannelsSelectElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "channels_select"
                        ]
                    },
                    placeholder: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            ConversationsSelectElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "conversations_select"
                        ]
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            LinearScaleElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "linear_scale"
                        ]
                    },
                    minValue: {
                        type: "number"
                    },
                    maxValue: {
                        type: "number"
                    },
                    initialValue: {
                        type: "number"
                    },
                    preLabel: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    postLabel: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            MultiChannelsSelectElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "multi_channels_select"
                        ]
                    },
                    placeholder: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            MultiConversationsSelectElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "multi_conversations_select"
                        ]
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            MultiUsersSelectElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "multi_users_select"
                        ]
                    },
                    placeholder: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            UsersSelectElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "users_select"
                        ]
                    },
                    placeholder: {
                        $ref: "#/components/schemas/PlainText"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            ToggleSwitchElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "toggle_switch"
                        ]
                    },
                    options: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    initialOptions: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "options",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            CheckboxElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "checkbox"
                        ]
                    },
                    options: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    initialOptions: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "options",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            RadioButtonElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "radio_button"
                        ]
                    },
                    options: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Option"
                        }
                    },
                    initialOption: {
                        $ref: "#/components/schemas/Option"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "options",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            TimePickerElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "time_picker"
                        ]
                    },
                    placeholder: {
                        oneOf: [
                            {
                                $ref: "#/components/schemas/PlainText"
                            },
                            {
                                $ref: "#/components/schemas/Markdown"
                            }
                        ]
                    },
                    initialTime: {
                        type: "string"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            VideoConferenceBlock: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "video_conf"
                        ]
                    },
                    callId: {
                        type: "string"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "callId"
                ]
            },
            PreviewBlockBase: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "preview"
                        ]
                    },
                    title: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/TextObject"
                        }
                    },
                    description: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/TextObject"
                        }
                    },
                    footer: {
                        $ref: "#/components/schemas/ContextBlock"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "title",
                    "description"
                ]
            },
            PreviewBlockWithThumb: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "preview"
                        ]
                    },
                    title: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/TextObject"
                        }
                    },
                    description: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/TextObject"
                        }
                    },
                    footer: {
                        $ref: "#/components/schemas/ContextBlock"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    thumb: {
                        $ref: "#/components/schemas/Image"
                    }
                },
                required: [
                    "type",
                    "title",
                    "description",
                    "thumb"
                ]
            },
            Image: {
                type: "object",
                properties: {
                    url: {
                        type: "string"
                    },
                    dimensions: {
                        type: "object",
                        properties: {
                            width: {
                                type: "number"
                            },
                            height: {
                                type: "number"
                            }
                        },
                        required: [
                            "width",
                            "height"
                        ]
                    }
                },
                required: [
                    "url"
                ]
            },
            PreviewBlockWithPreview: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "preview"
                        ]
                    },
                    title: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/TextObject"
                        }
                    },
                    description: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/TextObject"
                        }
                    },
                    footer: {
                        $ref: "#/components/schemas/ContextBlock"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    preview: {
                        $ref: "#/components/schemas/Image"
                    },
                    externalUrl: {
                        type: "string"
                    },
                    oembedUrl: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "title",
                    "description",
                    "preview"
                ]
            },
            InfoCardBlock: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "info_card"
                        ]
                    },
                    rows: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InfoCardRow"
                        }
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "rows"
                ]
            },
            InfoCardRow: {
                type: "object",
                properties: {
                    background: {
                        type: "string",
                        "enum": [
                            "default",
                            "secondary"
                        ]
                    },
                    elements: {
                        type: "array",
                        items: {
                            oneOf: [
                                {
                                    $ref: "#/components/schemas/PlainText"
                                },
                                {
                                    $ref: "#/components/schemas/Markdown"
                                },
                                {
                                    $ref: "#/components/schemas/FrameableIconElement"
                                }
                            ]
                        }
                    },
                    action: {
                        $ref: "#/components/schemas/IconButtonElement"
                    }
                },
                required: [
                    "background",
                    "elements"
                ]
            },
            FrameableIconElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "icon"
                        ]
                    },
                    icon: {
                        $ref: "#/components/schemas/AvailableIcons"
                    },
                    variant: {
                        type: "string",
                        "enum": [
                            "danger",
                            "default",
                            "warning",
                            "secondary"
                        ]
                    },
                    framed: {
                        type: "boolean"
                    }
                },
                required: [
                    "type",
                    "icon",
                    "variant"
                ]
            },
            AvailableIcons: {
                type: "string",
                "enum": [
                    "arrow-forward",
                    "clock",
                    "info",
                    "phone-issue",
                    "phone-off",
                    "phone-question-mark"
                ]
            },
            IconButtonElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "icon_button"
                        ]
                    },
                    icon: {
                        $ref: "#/components/schemas/IconElement"
                    },
                    label: {
                        type: "string"
                    },
                    url: {
                        type: "string"
                    },
                    value: {
                        type: "string"
                    },
                    appId: {
                        type: "string"
                    },
                    blockId: {
                        type: "string"
                    },
                    actionId: {
                        type: "string"
                    },
                    confirm: {
                        $ref: "#/components/schemas/ConfirmationDialog"
                    },
                    dispatchActionConfig: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/InputElementDispatchAction"
                        }
                    }
                },
                required: [
                    "type",
                    "icon",
                    "appId",
                    "blockId",
                    "actionId"
                ]
            },
            IconElement: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "icon"
                        ]
                    },
                    icon: {
                        $ref: "#/components/schemas/AvailableIcons"
                    },
                    variant: {
                        type: "string",
                        "enum": [
                            "danger",
                            "default",
                            "warning",
                            "secondary"
                        ]
                    }
                },
                required: [
                    "type",
                    "icon",
                    "variant"
                ]
            },
            Paragraph: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "PARAGRAPH"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Inlines"
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Inlines: {
                oneOf: [
                    {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                "enum": [
                                    "EMOJI"
                                ]
                            },
                            value: {
                                $ref: "#/components/schemas/Plain"
                            },
                            shortCode: {
                                type: "string"
                            }
                        },
                        required: [
                            "type",
                            "value",
                            "shortCode"
                        ]
                    },
                    {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                "enum": [
                                    "EMOJI"
                                ]
                            },
                            unicode: {
                                type: "string"
                            }
                        },
                        required: [
                            "type",
                            "unicode"
                        ]
                    },
                    {
                        $ref: "#/components/schemas/Timestamp"
                    },
                    {
                        $ref: "#/components/schemas/Bold"
                    },
                    {
                        $ref: "#/components/schemas/Plain"
                    },
                    {
                        $ref: "#/components/schemas/Italic"
                    },
                    {
                        $ref: "#/components/schemas/Strike"
                    },
                    {
                        $ref: "#/components/schemas/InlineCode"
                    },
                    {
                        $ref: "#/components/schemas/Image.o1"
                    },
                    {
                        $ref: "#/components/schemas/Link"
                    },
                    {
                        $ref: "#/components/schemas/UserMention"
                    },
                    {
                        $ref: "#/components/schemas/ChannelMention"
                    },
                    {
                        $ref: "#/components/schemas/Color"
                    },
                    {
                        $ref: "#/components/schemas/InlineKaTeX"
                    }
                ]
            },
            Plain: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "PLAIN_TEXT"
                        ]
                    },
                    value: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Timestamp: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "TIMESTAMP"
                        ]
                    },
                    value: {
                        type: "object",
                        properties: {
                            timestamp: {
                                type: "string"
                            },
                            format: {
                                type: "string",
                                "enum": [
                                    "d",
                                    "t",
                                    "f",
                                    "T",
                                    "D",
                                    "F",
                                    "R"
                                ]
                            }
                        },
                        required: [
                            "timestamp",
                            "format"
                        ]
                    },
                    fallback: {
                        $ref: "#/components/schemas/Plain"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Bold: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "BOLD"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            oneOf: [
                                {
                                    type: "object",
                                    properties: {
                                        type: {
                                            type: "string",
                                            "enum": [
                                                "EMOJI"
                                            ]
                                        },
                                        value: {
                                            $ref: "#/components/schemas/Plain"
                                        },
                                        shortCode: {
                                            type: "string"
                                        }
                                    },
                                    required: [
                                        "type",
                                        "value",
                                        "shortCode"
                                    ]
                                },
                                {
                                    type: "object",
                                    properties: {
                                        type: {
                                            type: "string",
                                            "enum": [
                                                "EMOJI"
                                            ]
                                        },
                                        unicode: {
                                            type: "string"
                                        }
                                    },
                                    required: [
                                        "type",
                                        "unicode"
                                    ]
                                },
                                {
                                    $ref: "#/components/schemas/Plain"
                                },
                                {
                                    $ref: "#/components/schemas/Italic"
                                },
                                {
                                    $ref: "#/components/schemas/Strike"
                                },
                                {
                                    $ref: "#/components/schemas/InlineCode"
                                },
                                {
                                    $ref: "#/components/schemas/Link"
                                },
                                {
                                    $ref: "#/components/schemas/UserMention"
                                },
                                {
                                    $ref: "#/components/schemas/ChannelMention"
                                }
                            ]
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Italic: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "ITALIC"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            oneOf: [
                                {
                                    type: "object",
                                    properties: {
                                        type: {
                                            type: "string",
                                            "enum": [
                                                "EMOJI"
                                            ]
                                        },
                                        value: {
                                            $ref: "#/components/schemas/Plain"
                                        },
                                        shortCode: {
                                            type: "string"
                                        }
                                    },
                                    required: [
                                        "type",
                                        "value",
                                        "shortCode"
                                    ]
                                },
                                {
                                    type: "object",
                                    properties: {
                                        type: {
                                            type: "string",
                                            "enum": [
                                                "EMOJI"
                                            ]
                                        },
                                        unicode: {
                                            type: "string"
                                        }
                                    },
                                    required: [
                                        "type",
                                        "unicode"
                                    ]
                                },
                                {
                                    $ref: "#/components/schemas/Bold"
                                },
                                {
                                    $ref: "#/components/schemas/Plain"
                                },
                                {
                                    $ref: "#/components/schemas/Strike"
                                },
                                {
                                    $ref: "#/components/schemas/InlineCode"
                                },
                                {
                                    $ref: "#/components/schemas/Link"
                                },
                                {
                                    $ref: "#/components/schemas/UserMention"
                                },
                                {
                                    $ref: "#/components/schemas/ChannelMention"
                                }
                            ]
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Strike: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "STRIKE"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            oneOf: [
                                {
                                    type: "object",
                                    properties: {
                                        type: {
                                            type: "string",
                                            "enum": [
                                                "EMOJI"
                                            ]
                                        },
                                        value: {
                                            $ref: "#/components/schemas/Plain"
                                        },
                                        shortCode: {
                                            type: "string"
                                        }
                                    },
                                    required: [
                                        "type",
                                        "value",
                                        "shortCode"
                                    ]
                                },
                                {
                                    type: "object",
                                    properties: {
                                        type: {
                                            type: "string",
                                            "enum": [
                                                "EMOJI"
                                            ]
                                        },
                                        unicode: {
                                            type: "string"
                                        }
                                    },
                                    required: [
                                        "type",
                                        "unicode"
                                    ]
                                },
                                {
                                    $ref: "#/components/schemas/Timestamp"
                                },
                                {
                                    $ref: "#/components/schemas/Bold"
                                },
                                {
                                    $ref: "#/components/schemas/Plain"
                                },
                                {
                                    $ref: "#/components/schemas/Italic"
                                },
                                {
                                    $ref: "#/components/schemas/InlineCode"
                                },
                                {
                                    $ref: "#/components/schemas/Link"
                                },
                                {
                                    $ref: "#/components/schemas/UserMention"
                                },
                                {
                                    $ref: "#/components/schemas/ChannelMention"
                                }
                            ]
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            InlineCode: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "INLINE_CODE"
                        ]
                    },
                    value: {
                        $ref: "#/components/schemas/Plain"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Link: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "LINK"
                        ]
                    },
                    value: {
                        $ref: "#/components/schemas/__type.o38"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            "__type.o38": {
                type: "object",
                properties: {
                    src: {
                        $ref: "#/components/schemas/Plain"
                    },
                    label: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    $ref: "#/components/schemas/Markup"
                                }
                            },
                            {
                                $ref: "#/components/schemas/Bold"
                            },
                            {
                                $ref: "#/components/schemas/Plain"
                            },
                            {
                                $ref: "#/components/schemas/Italic"
                            },
                            {
                                $ref: "#/components/schemas/Strike"
                            },
                            {
                                $ref: "#/components/schemas/ChannelMention"
                            }
                        ]
                    }
                },
                required: [
                    "src",
                    "label"
                ]
            },
            Markup: {
                oneOf: [
                    {
                        $ref: "#/components/schemas/Bold"
                    },
                    {
                        $ref: "#/components/schemas/Plain"
                    },
                    {
                        $ref: "#/components/schemas/Italic"
                    },
                    {
                        $ref: "#/components/schemas/Strike"
                    },
                    {
                        $ref: "#/components/schemas/ChannelMention"
                    }
                ]
            },
            ChannelMention: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "MENTION_CHANNEL"
                        ]
                    },
                    value: {
                        $ref: "#/components/schemas/Plain"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            UserMention: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "MENTION_USER"
                        ]
                    },
                    value: {
                        $ref: "#/components/schemas/Plain"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            "Image.o1": {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "IMAGE"
                        ]
                    },
                    value: {
                        type: "object",
                        properties: {
                            src: {
                                $ref: "#/components/schemas/Plain"
                            },
                            label: {
                                $ref: "#/components/schemas/Markup"
                            }
                        },
                        required: [
                            "src",
                            "label"
                        ]
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Color: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "COLOR"
                        ]
                    },
                    value: {
                        type: "object",
                        properties: {
                            r: {
                                type: "number"
                            },
                            g: {
                                type: "number"
                            },
                            b: {
                                type: "number"
                            },
                            a: {
                                type: "number"
                            }
                        },
                        required: [
                            "r",
                            "g",
                            "b",
                            "a"
                        ]
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            InlineKaTeX: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "INLINE_KATEX"
                        ]
                    },
                    value: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Code: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "CODE"
                        ]
                    },
                    language: {
                        type: "string"
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/CodeLine"
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            CodeLine: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "CODE_LINE"
                        ]
                    },
                    value: {
                        $ref: "#/components/schemas/Plain"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Heading: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "HEADING"
                        ]
                    },
                    level: {
                        type: "number",
                        "enum": [
                            1,
                            2,
                            3,
                            4
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Plain"
                        }
                    }
                },
                required: [
                    "type",
                    "level",
                    "value"
                ]
            },
            Quote: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "QUOTE"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Paragraph"
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            ListItem: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "LIST_ITEM"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Inlines"
                        }
                    },
                    number: {
                        type: "number"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Tasks: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "TASKS"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Task"
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            Task: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "TASK"
                        ]
                    },
                    status: {
                        type: "boolean"
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Inlines"
                        }
                    }
                },
                required: [
                    "type",
                    "status",
                    "value"
                ]
            },
            OrderedList: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "ORDERED_LIST"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/ListItem"
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            UnorderedList: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "UNORDERED_LIST"
                        ]
                    },
                    value: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/ListItem"
                        }
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            LineBreak: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "LINE_BREAK"
                        ]
                    }
                },
                required: [
                    "type"
                ]
            },
            KaTeX: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "KATEX"
                        ]
                    },
                    value: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            "BigEmoji.o1": {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "BIG_EMOJI"
                        ]
                    },
                    value: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Emoji.o1"
                                        },
                                        {
                                            $ref: "#/components/schemas/Emoji.o1"
                                        },
                                        {
                                            $ref: "#/components/schemas/Emoji.o1"
                                        }
                                    ]
                                },
                                minItems: 3,
                                maxItems: 3
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Emoji.o1"
                                        },
                                        {
                                            $ref: "#/components/schemas/Emoji.o1"
                                        }
                                    ]
                                },
                                minItems: 2,
                                maxItems: 2
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Emoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    }
                },
                required: [
                    "type",
                    "value"
                ]
            },
            "Emoji.o1": {
                oneOf: [
                    {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                "enum": [
                                    "EMOJI"
                                ]
                            },
                            value: {
                                $ref: "#/components/schemas/Plain"
                            },
                            shortCode: {
                                type: "string"
                            }
                        },
                        required: [
                            "type",
                            "value",
                            "shortCode"
                        ]
                    },
                    {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                "enum": [
                                    "EMOJI"
                                ]
                            },
                            unicode: {
                                type: "string"
                            }
                        },
                        required: [
                            "type",
                            "unicode"
                        ]
                    }
                ]
            },
            PickIUser_idusername: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    username: {
                        type: "string"
                    }
                },
                required: [
                    "_id"
                ],
                description: "From T, pick a set of properties whose keys are in the union K"
            },
            MessageUrl: {
                type: "object",
                properties: {
                    url: {
                        type: "string"
                    },
                    source: {
                        type: "string"
                    },
                    meta: {
                        $ref: "#/components/schemas/Recordstringstring"
                    },
                    headers: {
                        type: "object",
                        properties: {
                            contentLength: {
                                type: "string"
                            },
                            contentType: {
                                type: "string"
                            }
                        },
                        required: []
                    },
                    ignoreParse: {
                        type: "boolean"
                    },
                    parsedUrl: {
                        $ref: "#/components/schemas/Pickurl.UrlWithStringQueryhosthashpathnameprotocolportquerysearchhostname"
                    }
                },
                required: [
                    "url",
                    "meta"
                ]
            },
            Recordstringstring: {
                type: "object",
                properties: {},
                required: [],
                description: "Construct a type with a set of properties K of type T",
                additionalProperties: {
                    type: "string"
                }
            },
            "Pickurl.UrlWithStringQueryhosthashpathnameprotocolportquerysearchhostname": {
                type: "object",
                properties: {
                    host: {
                        type: "string",
                        nullable: true
                    },
                    hash: {
                        type: "string",
                        nullable: true
                    },
                    pathname: {
                        type: "string",
                        nullable: true
                    },
                    protocol: {
                        type: "string",
                        nullable: true
                    },
                    port: {
                        type: "string",
                        nullable: true
                    },
                    query: {
                        type: "string",
                        nullable: true
                    },
                    search: {
                        type: "string",
                        nullable: true
                    },
                    hostname: {
                        type: "string",
                        nullable: true
                    }
                },
                required: [
                    "host",
                    "hash",
                    "pathname",
                    "protocol",
                    "port",
                    "query",
                    "search",
                    "hostname"
                ],
                description: "From T, pick a set of properties whose keys are in the union K"
            },
            FileProp: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                    type: {
                        type: "string"
                    },
                    format: {
                        type: "string"
                    },
                    size: {
                        type: "number"
                    }
                },
                required: [
                    "_id",
                    "name",
                    "type",
                    "format",
                    "size"
                ]
            },
            MessageAttachment: {
                oneOf: [
                    {
                        $ref: "#/components/schemas/typefilevideo_urlstringvideo_typestringvideo_sizenumberfileFilePropundefinedMessageAttachmentBase"
                    },
                    {
                        $ref: "#/components/schemas/typefileimage_dimensionsDimensionsundefinedimage_previewstringundefinedimage_urlstringimage_typestringundefinedimage_sizenumberundefinedfileFilePropundefinedMessageAttachmentBase"
                    },
                    {
                        $ref: "#/components/schemas/typefileaudio_urlstringaudio_typestringaudio_sizenumberundefinedfileFilePropundefinedMessageAttachmentBase"
                    },
                    {
                        $ref: "#/components/schemas/typefileMessageAttachmentBase"
                    },
                    {
                        $ref: "#/components/schemas/MessageAttachmentAction"
                    },
                    {
                        $ref: "#/components/schemas/MessageAttachmentDefault"
                    },
                    {
                        $ref: "#/components/schemas/MessageQuoteAttachment"
                    }
                ]
            },
            typefilevideo_urlstringvideo_typestringvideo_sizenumberfileFilePropundefinedMessageAttachmentBase: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "file"
                        ]
                    },
                    video_url: {
                        type: "string"
                    },
                    video_type: {
                        type: "string"
                    },
                    video_size: {
                        type: "number"
                    },
                    file: {
                        $ref: "#/components/schemas/FileProp"
                    },
                    id: {
                        type: "string"
                    },
                    title: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    collapsed: {
                        type: "boolean"
                    },
                    description: {
                        type: "string"
                    },
                    descriptionMd: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    text: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    size: {
                        type: "number"
                    },
                    format: {
                        type: "string"
                    },
                    title_link: {
                        type: "string"
                    },
                    title_link_download: {
                        type: "boolean"
                    },
                    encryption: {
                        type: "object",
                        properties: {
                            iv: {
                                type: "string"
                            },
                            key: {
                                $ref: "#/components/schemas/JsonWebKey"
                            }
                        },
                        required: [
                            "iv",
                            "key"
                        ]
                    },
                    hashes: {
                        type: "object",
                        properties: {
                            sha256: {
                                type: "string"
                            }
                        },
                        required: [
                            "sha256"
                        ]
                    }
                },
                required: [
                    "type",
                    "video_url",
                    "video_type",
                    "video_size"
                ]
            },
            JsonWebKey: {
                type: "object",
                properties: {
                    alg: {
                        type: "string"
                    },
                    crv: {
                        type: "string"
                    },
                    d: {
                        type: "string"
                    },
                    dp: {
                        type: "string"
                    },
                    dq: {
                        type: "string"
                    },
                    e: {
                        type: "string"
                    },
                    ext: {
                        type: "boolean"
                    },
                    k: {
                        type: "string"
                    },
                    key_ops: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    kty: {
                        type: "string"
                    },
                    n: {
                        type: "string"
                    },
                    oth: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/RsaOtherPrimesInfo"
                        }
                    },
                    p: {
                        type: "string"
                    },
                    q: {
                        type: "string"
                    },
                    qi: {
                        type: "string"
                    },
                    use: {
                        type: "string"
                    },
                    x: {
                        type: "string"
                    },
                    y: {
                        type: "string"
                    }
                },
                required: []
            },
            RsaOtherPrimesInfo: {
                type: "object",
                properties: {
                    d: {
                        type: "string"
                    },
                    r: {
                        type: "string"
                    },
                    t: {
                        type: "string"
                    }
                },
                required: []
            },
            typefileimage_dimensionsDimensionsundefinedimage_previewstringundefinedimage_urlstringimage_typestringundefinedimage_sizenumberundefinedfileFilePropundefinedMessageAttachmentBase: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "file"
                        ]
                    },
                    image_dimensions: {
                        $ref: "#/components/schemas/Dimensions"
                    },
                    image_preview: {
                        type: "string"
                    },
                    image_url: {
                        type: "string"
                    },
                    image_type: {
                        type: "string"
                    },
                    image_size: {
                        type: "number"
                    },
                    file: {
                        $ref: "#/components/schemas/FileProp"
                    },
                    id: {
                        type: "string"
                    },
                    title: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    collapsed: {
                        type: "boolean"
                    },
                    description: {
                        type: "string"
                    },
                    descriptionMd: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    text: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    size: {
                        type: "number"
                    },
                    format: {
                        type: "string"
                    },
                    title_link: {
                        type: "string"
                    },
                    title_link_download: {
                        type: "boolean"
                    },
                    encryption: {
                        type: "object",
                        properties: {
                            iv: {
                                type: "string"
                            },
                            key: {
                                $ref: "#/components/schemas/JsonWebKey"
                            }
                        },
                        required: [
                            "iv",
                            "key"
                        ]
                    },
                    hashes: {
                        type: "object",
                        properties: {
                            sha256: {
                                type: "string"
                            }
                        },
                        required: [
                            "sha256"
                        ]
                    }
                },
                required: [
                    "type",
                    "image_url"
                ]
            },
            Dimensions: {
                type: "object",
                properties: {
                    width: {
                        type: "number"
                    },
                    height: {
                        type: "number"
                    }
                },
                required: [
                    "width",
                    "height"
                ]
            },
            typefileaudio_urlstringaudio_typestringaudio_sizenumberundefinedfileFilePropundefinedMessageAttachmentBase: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "file"
                        ]
                    },
                    audio_url: {
                        type: "string"
                    },
                    audio_type: {
                        type: "string"
                    },
                    audio_size: {
                        type: "number"
                    },
                    file: {
                        $ref: "#/components/schemas/FileProp"
                    },
                    id: {
                        type: "string"
                    },
                    title: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    collapsed: {
                        type: "boolean"
                    },
                    description: {
                        type: "string"
                    },
                    descriptionMd: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    text: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    size: {
                        type: "number"
                    },
                    format: {
                        type: "string"
                    },
                    title_link: {
                        type: "string"
                    },
                    title_link_download: {
                        type: "boolean"
                    },
                    encryption: {
                        type: "object",
                        properties: {
                            iv: {
                                type: "string"
                            },
                            key: {
                                $ref: "#/components/schemas/JsonWebKey"
                            }
                        },
                        required: [
                            "iv",
                            "key"
                        ]
                    },
                    hashes: {
                        type: "object",
                        properties: {
                            sha256: {
                                type: "string"
                            }
                        },
                        required: [
                            "sha256"
                        ]
                    }
                },
                required: [
                    "type",
                    "audio_url",
                    "audio_type"
                ]
            },
            typefileMessageAttachmentBase: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "file"
                        ]
                    },
                    id: {
                        type: "string"
                    },
                    title: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    collapsed: {
                        type: "boolean"
                    },
                    description: {
                        type: "string"
                    },
                    descriptionMd: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    text: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    size: {
                        type: "number"
                    },
                    format: {
                        type: "string"
                    },
                    title_link: {
                        type: "string"
                    },
                    title_link_download: {
                        type: "boolean"
                    },
                    encryption: {
                        type: "object",
                        properties: {
                            iv: {
                                type: "string"
                            },
                            key: {
                                $ref: "#/components/schemas/JsonWebKey"
                            }
                        },
                        required: [
                            "iv",
                            "key"
                        ]
                    },
                    hashes: {
                        type: "object",
                        properties: {
                            sha256: {
                                type: "string"
                            }
                        },
                        required: [
                            "sha256"
                        ]
                    }
                },
                required: [
                    "type"
                ]
            },
            MessageAttachmentAction: {
                type: "object",
                properties: {
                    button_alignment: {
                        type: "string",
                        "enum": [
                            "horizontal",
                            "vertical"
                        ]
                    },
                    actions: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Action"
                        }
                    },
                    id: {
                        type: "string"
                    },
                    title: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    collapsed: {
                        type: "boolean"
                    },
                    description: {
                        type: "string"
                    },
                    descriptionMd: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    text: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    size: {
                        type: "number"
                    },
                    format: {
                        type: "string"
                    },
                    title_link: {
                        type: "string"
                    },
                    title_link_download: {
                        type: "boolean"
                    },
                    encryption: {
                        type: "object",
                        properties: {
                            iv: {
                                type: "string"
                            },
                            key: {
                                $ref: "#/components/schemas/JsonWebKey"
                            }
                        },
                        required: [
                            "iv",
                            "key"
                        ]
                    },
                    hashes: {
                        type: "object",
                        properties: {
                            sha256: {
                                type: "string"
                            }
                        },
                        required: [
                            "sha256"
                        ]
                    }
                },
                required: [
                    "actions"
                ]
            },
            Action: {
                type: "object",
                properties: {
                    msgId: {
                        type: "string"
                    },
                    type: {
                        type: "string",
                        "enum": [
                            "button"
                        ]
                    },
                    text: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    msg: {
                        type: "string"
                    },
                    url: {
                        type: "string"
                    },
                    image_url: {
                        type: "string"
                    },
                    is_webview: {
                        type: "boolean",
                        "enum": [
                            true
                        ]
                    },
                    msg_in_chat_window: {
                        type: "boolean",
                        "enum": [
                            true
                        ]
                    },
                    msg_processing_type: {
                        type: "string",
                        "enum": [
                            "sendMessage",
                            "respondWithMessage",
                            "respondWithQuotedMessage"
                        ]
                    }
                },
                required: [
                    "type",
                    "text"
                ]
            },
            MessageAttachmentDefault: {
                type: "object",
                properties: {
                    author_icon: {
                        type: "string"
                    },
                    author_link: {
                        type: "string"
                    },
                    author_name: {
                        type: "string"
                    },
                    fields: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/FieldProps"
                        }
                    },
                    image_url: {
                        type: "string"
                    },
                    image_dimensions: {
                        $ref: "#/components/schemas/Dimensions"
                    },
                    mrkdwn_in: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/MarkdownFields"
                        }
                    },
                    pretext: {
                        type: "string"
                    },
                    text: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    thumb_url: {
                        type: "string"
                    },
                    color: {
                        type: "string"
                    },
                    id: {
                        type: "string"
                    },
                    title: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    collapsed: {
                        type: "boolean"
                    },
                    description: {
                        type: "string"
                    },
                    descriptionMd: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    size: {
                        type: "number"
                    },
                    format: {
                        type: "string"
                    },
                    title_link: {
                        type: "string"
                    },
                    title_link_download: {
                        type: "boolean"
                    },
                    encryption: {
                        type: "object",
                        properties: {
                            iv: {
                                type: "string"
                            },
                            key: {
                                $ref: "#/components/schemas/JsonWebKey"
                            }
                        },
                        required: [
                            "iv",
                            "key"
                        ]
                    },
                    hashes: {
                        type: "object",
                        properties: {
                            sha256: {
                                type: "string"
                            }
                        },
                        required: [
                            "sha256"
                        ]
                    }
                },
                required: []
            },
            FieldProps: {
                type: "object",
                properties: {
                    short: {
                        type: "boolean"
                    },
                    title: {
                        type: "string"
                    },
                    value: {
                        type: "string"
                    }
                },
                required: [
                    "title",
                    "value"
                ]
            },
            MarkdownFields: {
                type: "string",
                "enum": [
                    "text",
                    "pretext",
                    "fields"
                ]
            },
            MessageQuoteAttachment: {
                type: "object",
                properties: {
                    author_name: {
                        type: "string"
                    },
                    author_link: {
                        type: "string"
                    },
                    author_icon: {
                        type: "string"
                    },
                    message_link: {
                        type: "string"
                    },
                    text: {
                        type: "string"
                    },
                    md: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    attachments: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/MessageAttachment"
                        }
                    },
                    id: {
                        type: "string"
                    },
                    title: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    collapsed: {
                        type: "boolean"
                    },
                    description: {
                        type: "string"
                    },
                    descriptionMd: {
                        oneOf: [
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/Paragraph"
                                        },
                                        {
                                            $ref: "#/components/schemas/Code"
                                        },
                                        {
                                            $ref: "#/components/schemas/Heading"
                                        },
                                        {
                                            $ref: "#/components/schemas/Quote"
                                        },
                                        {
                                            $ref: "#/components/schemas/ListItem"
                                        },
                                        {
                                            $ref: "#/components/schemas/Tasks"
                                        },
                                        {
                                            $ref: "#/components/schemas/OrderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/UnorderedList"
                                        },
                                        {
                                            $ref: "#/components/schemas/LineBreak"
                                        },
                                        {
                                            $ref: "#/components/schemas/KaTeX"
                                        }
                                    ]
                                }
                            },
                            {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            $ref: "#/components/schemas/BigEmoji.o1"
                                        }
                                    ]
                                },
                                minItems: 1,
                                maxItems: 1
                            }
                        ]
                    },
                    size: {
                        type: "number"
                    },
                    format: {
                        type: "string"
                    },
                    title_link: {
                        type: "string"
                    },
                    title_link_download: {
                        type: "boolean"
                    },
                    encryption: {
                        type: "object",
                        properties: {
                            iv: {
                                type: "string"
                            },
                            key: {
                                $ref: "#/components/schemas/JsonWebKey"
                            }
                        },
                        required: [
                            "iv",
                            "key"
                        ]
                    },
                    hashes: {
                        type: "object",
                        properties: {
                            sha256: {
                                type: "string"
                            }
                        },
                        required: [
                            "sha256"
                        ]
                    }
                },
                required: [
                    "author_name",
                    "author_link",
                    "author_icon",
                    "text"
                ]
            },
            Recordstringany: {
                type: "object",
                properties: {},
                required: [],
                description: "Construct a type with a set of properties K of type T",
                additionalProperties: {}
            },
            Token: {
                type: "object",
                properties: {
                    token: {
                        type: "string"
                    },
                    text: {
                        type: "string"
                    },
                    type: {
                        type: "string",
                        "enum": [
                            "code",
                            "inlinecode",
                            "bold",
                            "italic",
                            "strike",
                            "link"
                        ]
                    },
                    noHtml: {
                        type: "string"
                    },
                    highlight: {
                        type: "boolean"
                    }
                },
                required: [
                    "token",
                    "text"
                ]
            },
            PickIOmnichannelServiceLevelAgreementsname: {
                type: "object",
                properties: {
                    name: {
                        type: "string"
                    }
                },
                required: [
                    "name"
                ],
                description: "From T, pick a set of properties whose keys are in the union K"
            },
            PickILivechatPrioritynamei18n: {
                type: "object",
                properties: {
                    name: {
                        type: "string"
                    },
                    i18n: {
                        type: "string"
                    }
                },
                required: [
                    "i18n"
                ],
                description: "From T, pick a set of properties whose keys are in the union K"
            },
            IMessageCustomFields: {
                type: "object",
                properties: {},
                required: []
            },
            IEncryptedContentV1: {
                type: "object",
                properties: {
                    algorithm: {
                        type: "string",
                        "enum": [
                            "rc.v1.aes-sha2"
                        ]
                    },
                    ciphertext: {
                        type: "string"
                    }
                },
                required: [
                    "algorithm",
                    "ciphertext"
                ]
            },
            IEncryptedContentV2: {
                type: "object",
                properties: {
                    algorithm: {
                        type: "string",
                        "enum": [
                            "rc.v2.aes-sha2"
                        ]
                    },
                    ciphertext: {
                        type: "string"
                    },
                    iv: {
                        type: "string"
                    },
                    kid: {
                        type: "string"
                    }
                },
                required: [
                    "algorithm",
                    "ciphertext",
                    "iv",
                    "kid"
                ]
            },
            IEncryptedContentFederation: {
                type: "object",
                properties: {
                    algorithm: {
                        type: "string",
                        "enum": [
                            "m.megolm.v1.aes-sha2"
                        ]
                    },
                    ciphertext: {
                        type: "string"
                    }
                },
                required: [
                    "algorithm",
                    "ciphertext"
                ]
            },
            ICustomSound: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                    extension: {
                        type: "string"
                    },
                    src: {
                        type: "string"
                    },
                    random: {},
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    }
                },
                required: [
                    "_id",
                    "name",
                    "extension"
                ]
            },
            IInvite: {
                type: "object",
                properties: {
                    days: {
                        type: "number"
                    },
                    maxUses: {
                        type: "number"
                    },
                    rid: {
                        type: "string"
                    },
                    userId: {
                        type: "string"
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time"
                    },
                    expires: {
                        type: "string",
                        format: "date-time",
                        nullable: true
                    },
                    uses: {
                        type: "number"
                    },
                    url: {
                        type: "string"
                    },
                    _id: {
                        type: "string"
                    },
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    }
                },
                required: [
                    "days",
                    "maxUses",
                    "rid",
                    "userId",
                    "createdAt",
                    "expires",
                    "uses",
                    "url",
                    "_id",
                    "_updatedAt"
                ]
            },
            IOAuthApps: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                    active: {
                        type: "boolean"
                    },
                    clientId: {
                        type: "string"
                    },
                    clientSecret: {
                        type: "string"
                    },
                    redirectUri: {
                        type: "string"
                    },
                    _createdAt: {
                        type: "string",
                        format: "date-time"
                    },
                    _createdBy: {
                        type: "object",
                        properties: {
                            _id: {
                                type: "string"
                            },
                            username: {
                                type: "string"
                            }
                        },
                        required: [
                            "_id",
                            "username"
                        ]
                    },
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    },
                    appId: {
                        type: "string"
                    }
                },
                required: [
                    "_id",
                    "name",
                    "active",
                    "clientId",
                    "redirectUri",
                    "_createdAt",
                    "_createdBy",
                    "_updatedAt"
                ]
            },
            IPermission: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    },
                    roles: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    group: {
                        type: "string"
                    },
                    groupPermissionId: {
                        type: "string"
                    },
                    level: {
                        type: "string",
                        "enum": [
                            "settings"
                        ]
                    },
                    section: {
                        type: "string"
                    },
                    sectionPermissionId: {
                        type: "string"
                    },
                    settingId: {
                        type: "string"
                    },
                    sorter: {
                        type: "number"
                    }
                },
                required: [
                    "_id",
                    "_updatedAt",
                    "roles"
                ]
            },
            ISubscription: {
                type: "object",
                properties: {
                    u: {
                        $ref: "#/components/schemas/PickIUser_idnameusername"
                    },
                    v: {
                        $ref: "#/components/schemas/PickIUser_idnameusernamestatustokenstringundefined"
                    },
                    rid: {
                        type: "string"
                    },
                    open: {
                        type: "boolean"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    name: {
                        type: "string"
                    },
                    alert: {
                        type: "boolean"
                    },
                    unread: {
                        type: "number"
                    },
                    t: {
                        $ref: "#/components/schemas/RoomType"
                    },
                    ls: {
                        type: "string",
                        format: "date-time"
                    },
                    f: {
                        type: "boolean"
                    },
                    lr: {
                        type: "string",
                        format: "date-time"
                    },
                    hideUnreadStatus: {
                        type: "boolean",
                        "enum": [
                            true
                        ]
                    },
                    hideMentionStatus: {
                        type: "boolean",
                        "enum": [
                            true
                        ]
                    },
                    teamMain: {
                        type: "boolean"
                    },
                    teamId: {
                        type: "string"
                    },
                    userMentions: {
                        type: "number"
                    },
                    groupMentions: {
                        type: "number"
                    },
                    broadcast: {
                        type: "boolean",
                        "enum": [
                            true
                        ]
                    },
                    tunread: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    tunreadGroup: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    tunreadUser: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    prid: {
                        type: "string"
                    },
                    roles: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    onHold: {
                        type: "boolean"
                    },
                    encrypted: {
                        type: "boolean"
                    },
                    E2EKey: {
                        type: "string"
                    },
                    E2ESuggestedKey: {
                        type: "string"
                    },
                    unreadAlert: {
                        type: "string",
                        "enum": [
                            "default",
                            "mentions",
                            "all",
                            "nothing"
                        ]
                    },
                    fname: {
                        type: "string"
                    },
                    code: {},
                    archived: {
                        type: "boolean"
                    },
                    audioNotificationValue: {
                        type: "string"
                    },
                    desktopNotifications: {
                        type: "string",
                        "enum": [
                            "mentions",
                            "all",
                            "nothing"
                        ]
                    },
                    mobilePushNotifications: {
                        type: "string",
                        "enum": [
                            "mentions",
                            "all",
                            "nothing"
                        ]
                    },
                    emailNotifications: {
                        type: "string",
                        "enum": [
                            "mentions",
                            "all",
                            "nothing"
                        ]
                    },
                    userHighlights: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    blocked: {},
                    blocker: {},
                    autoTranslate: {
                        type: "boolean"
                    },
                    autoTranslateLanguage: {
                        type: "string"
                    },
                    disableNotifications: {
                        type: "boolean"
                    },
                    muteGroupMentions: {
                        type: "boolean"
                    },
                    ignored: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    department: {},
                    desktopPrefOrigin: {
                        type: "string",
                        "enum": [
                            "user",
                            "subscription"
                        ]
                    },
                    mobilePrefOrigin: {
                        type: "string",
                        "enum": [
                            "user",
                            "subscription"
                        ]
                    },
                    emailPrefOrigin: {
                        type: "string",
                        "enum": [
                            "user",
                            "subscription"
                        ]
                    },
                    customFields: {
                        $ref: "#/components/schemas/Recordstringany"
                    },
                    oldRoomKeys: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/OldKey"
                        }
                    },
                    suggestedOldRoomKeys: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/OldKey"
                        }
                    },
                    status: {
                        type: "string",
                        "enum": [
                            "INVITED"
                        ]
                    },
                    inviter: {
                        $ref: "#/components/schemas/RequiredPickIUser_idusernamePickIUsername"
                    },
                    abacLastTimeChecked: {
                        type: "string",
                        format: "date-time"
                    },
                    _id: {
                        type: "string"
                    },
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    }
                },
                required: [
                    "u",
                    "rid",
                    "open",
                    "ts",
                    "name",
                    "unread",
                    "t",
                    "ls",
                    "lr",
                    "userMentions",
                    "groupMentions",
                    "_id",
                    "_updatedAt"
                ]
            },
            PickIUser_idnameusername: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                    username: {
                        type: "string"
                    }
                },
                required: [
                    "_id"
                ],
                description: "From T, pick a set of properties whose keys are in the union K"
            },
            PickIUser_idnameusernamestatustokenstringundefined: {
                type: "object",
                properties: {
                    _id: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                    username: {
                        type: "string"
                    },
                    status: {
                        type: "string",
                        "enum": [
                            "online",
                            "away",
                            "offline",
                            "busy",
                            "disabled"
                        ]
                    },
                    token: {
                        type: "string"
                    }
                },
                required: [
                    "_id"
                ]
            },
            RoomType: {
                type: "string",
                "enum": [
                    "c",
                    "d",
                    "p",
                    "l"
                ]
            },
            OldKey: {
                type: "object",
                properties: {
                    e2eKeyId: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    E2EKey: {
                        type: "string"
                    }
                },
                required: [
                    "e2eKeyId",
                    "ts",
                    "E2EKey"
                ]
            },
            IMediaCall: {
                type: "object",
                properties: {
                    service: {
                        type: "string",
                        "enum": [
                            "webrtc"
                        ]
                    },
                    kind: {
                        type: "string",
                        "enum": [
                            "direct"
                        ]
                    },
                    state: {
                        $ref: "#/components/schemas/MediaCallState"
                    },
                    createdBy: {
                        $ref: "#/components/schemas/MediaCallContactMediaCallActorType"
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time"
                    },
                    caller: {
                        $ref: "#/components/schemas/MediaCallSignedContactMediaCallActorType"
                    },
                    callee: {
                        $ref: "#/components/schemas/MediaCallContactMediaCallActorType"
                    },
                    ended: {
                        type: "boolean"
                    },
                    endedBy: {
                        oneOf: [
                            {
                                $ref: "#/components/schemas/MediaCallActorMediaCallActorType"
                            },
                            {
                                $ref: "#/components/schemas/ServerActor"
                            }
                        ]
                    },
                    endedAt: {
                        type: "string",
                        format: "date-time"
                    },
                    hangupReason: {
                        type: "string"
                    },
                    expiresAt: {
                        type: "string",
                        format: "date-time"
                    },
                    acceptedAt: {
                        type: "string",
                        description: "The timestamp of the moment the callee accepted the call",
                        format: "date-time"
                    },
                    activatedAt: {
                        type: "string",
                        description: "The timestamp of the moment either side reported the call as active for the first time",
                        format: "date-time"
                    },
                    callerRequestedId: {
                        type: "string"
                    },
                    parentCallId: {
                        type: "string"
                    },
                    transferredBy: {
                        $ref: "#/components/schemas/MediaCallSignedContactMediaCallActorType",
                        description: "transferred* fields are filled as soon as the transfer is requested, but the old call will only end when the new one is created"
                    },
                    transferredTo: {
                        $ref: "#/components/schemas/MediaCallContactMediaCallActorType"
                    },
                    transferredAt: {
                        type: "string",
                        format: "date-time"
                    },
                    uids: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    _id: {
                        type: "string"
                    },
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    }
                },
                required: [
                    "service",
                    "kind",
                    "state",
                    "createdBy",
                    "createdAt",
                    "caller",
                    "callee",
                    "ended",
                    "expiresAt",
                    "uids",
                    "_id",
                    "_updatedAt"
                ]
            },
            MediaCallState: {
                type: "string",
                "enum": [
                    "active",
                    "none",
                    "ringing",
                    "accepted",
                    "hangup"
                ]
            },
            MediaCallContactMediaCallActorType: {
                type: "object",
                properties: {
                    type: {
                        $ref: "#/components/schemas/MediaCallActorType"
                    },
                    id: {
                        type: "string"
                    },
                    contractId: {
                        type: "string"
                    },
                    displayName: {
                        type: "string"
                    },
                    username: {
                        type: "string"
                    },
                    sipExtension: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "id"
                ]
            },
            MediaCallActorType: {
                type: "string",
                "enum": [
                    "user",
                    "sip"
                ]
            },
            MediaCallSignedContactMediaCallActorType: {
                type: "object",
                properties: {
                    type: {
                        $ref: "#/components/schemas/MediaCallActorType"
                    },
                    id: {
                        type: "string"
                    },
                    contractId: {
                        type: "string"
                    },
                    displayName: {
                        type: "string"
                    },
                    username: {
                        type: "string"
                    },
                    sipExtension: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "id",
                    "contractId"
                ]
            },
            MediaCallActorMediaCallActorType: {
                type: "object",
                properties: {
                    type: {
                        $ref: "#/components/schemas/MediaCallActorType"
                    },
                    id: {
                        type: "string"
                    },
                    contractId: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "id"
                ]
            },
            ServerActor: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        "enum": [
                            "server"
                        ]
                    },
                    id: {
                        type: "string",
                        "enum": [
                            "server"
                        ]
                    }
                },
                required: [
                    "type",
                    "id"
                ]
            },
            CallHistoryItem: {
                oneOf: [
                    {
                        $ref: "#/components/schemas/IInternalMediaCallHistoryItem"
                    },
                    {
                        $ref: "#/components/schemas/IExternalMediaCallHistoryItem"
                    }
                ]
            },
            IInternalMediaCallHistoryItem: {
                type: "object",
                properties: {
                    external: {
                        type: "boolean",
                        "enum": [
                            false
                        ]
                    },
                    contactId: {
                        type: "string"
                    },
                    contactName: {
                        type: "string"
                    },
                    contactUsername: {
                        type: "string"
                    },
                    rid: {
                        type: "string"
                    },
                    messageId: {
                        type: "string"
                    },
                    type: {
                        type: "string",
                        "enum": [
                            "media-call"
                        ]
                    },
                    duration: {
                        type: "number"
                    },
                    endedAt: {
                        type: "string",
                        format: "date-time"
                    },
                    uid: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    callId: {
                        type: "string"
                    },
                    direction: {
                        type: "string",
                        "enum": [
                            "inbound",
                            "outbound"
                        ]
                    },
                    state: {
                        $ref: "#/components/schemas/CallHistoryItemState"
                    },
                    _id: {
                        type: "string"
                    },
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    }
                },
                required: [
                    "external",
                    "contactId",
                    "type",
                    "duration",
                    "endedAt",
                    "uid",
                    "ts",
                    "callId",
                    "direction",
                    "state",
                    "_id",
                    "_updatedAt"
                ]
            },
            CallHistoryItemState: {
                type: "string",
                "enum": [
                    "ended",
                    "not-answered",
                    "failed",
                    "error",
                    "transferred"
                ]
            },
            IExternalMediaCallHistoryItem: {
                type: "object",
                properties: {
                    external: {
                        type: "boolean",
                        "enum": [
                            true
                        ]
                    },
                    contactExtension: {
                        type: "string"
                    },
                    type: {
                        type: "string",
                        "enum": [
                            "media-call"
                        ]
                    },
                    duration: {
                        type: "number"
                    },
                    endedAt: {
                        type: "string",
                        format: "date-time"
                    },
                    uid: {
                        type: "string"
                    },
                    ts: {
                        type: "string",
                        format: "date-time"
                    },
                    callId: {
                        type: "string"
                    },
                    direction: {
                        type: "string",
                        "enum": [
                            "inbound",
                            "outbound"
                        ]
                    },
                    state: {
                        $ref: "#/components/schemas/CallHistoryItemState"
                    },
                    _id: {
                        type: "string"
                    },
                    _updatedAt: {
                        type: "string",
                        format: "date-time"
                    }
                },
                required: [
                    "external",
                    "contactExtension",
                    "type",
                    "duration",
                    "endedAt",
                    "uid",
                    "ts",
                    "callId",
                    "direction",
                    "state",
                    "_id",
                    "_updatedAt"
                ]
            }
        }
    },
    schemas: [
        {
            oneOf: [
                {
                    $ref: "#/components/schemas/IMessage"
                },
                {
                    $ref: "#/components/schemas/ICustomSound"
                },
                {
                    $ref: "#/components/schemas/IInvite"
                },
                {
                    $ref: "#/components/schemas/IOAuthApps"
                },
                {
                    $ref: "#/components/schemas/IPermission"
                },
                {
                    $ref: "#/components/schemas/ISubscription"
                },
                {
                    $ref: "#/components/schemas/IMediaCall"
                }
            ]
        },
        {
            $ref: "#/components/schemas/CallHistoryItem"
        }
    ]
}

