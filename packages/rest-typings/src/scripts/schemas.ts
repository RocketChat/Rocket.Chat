import type { SchemaObject } from 'ajv';

export const schemas: SchemaObject = {
	IRoom: {
		type: 'object',
		properties: {
			_id: {
				type: 'string',
				description: 'RoomID',
			},
			t: {
				type: 'string',
				description: 'RoomType',
			},
			name: {
				type: 'string',
			},
			fname: {
				type: 'string',
			},
			msgs: {
				type: 'integer',
			},
			default: {
				type: 'boolean',
			},
			broadcast: {
				type: 'boolean',
				enum: [true],
			},
			featured: {
				type: 'boolean',
				enum: [true],
			},
			announcement: {
				type: 'string',
			},
			joinCodeRequired: {
				type: 'boolean',
			},
			announcementDetails: {
				type: 'object',
				properties: {
					style: {
						type: 'string',
					},
				},
			},
			encrypted: {
				type: 'boolean',
			},
			topic: {
				type: 'string',
			},
			reactWhenReadOnly: {
				type: 'boolean',
			},
			sysMes: {
				oneOf: [
					{
						type: 'array',
						items: {
							type: 'string',
							description: 'MessageTypesValues',
						},
					},
					{
						type: 'boolean',
					},
				],
			},
			u: {
				type: 'object',
				properties: {
					_id: {
						type: 'string',
					},
					username: {
						type: 'string',
					},
					name: {
						type: 'string',
					},
				},
			},
			uids: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
			lastMessage: {
				$ref: '#/components/schemas/IMessage',
			},
			lm: {
				type: 'string',
				format: 'date-time',
			},
			usersCount: {
				type: 'integer',
			},
			callStatus: {
				type: 'string',
				description: 'CallStatus',
			},
			webRtcCallStartTime: {
				type: 'string',
				format: 'date-time',
			},
			servedBy: {
				type: 'object',
				properties: {
					_id: {
						type: 'string',
					},
				},
			},
			streamingOptions: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
					},
					type: {
						type: 'string',
					},
					url: {
						type: 'string',
					},
					thumbnail: {
						type: 'string',
					},
					isAudioOnly: {
						type: 'boolean',
					},
					message: {
						type: 'string',
					},
				},
			},
			prid: {
				type: 'string',
			},
			avatarETag: {
				type: 'string',
			},
			teamMain: {
				type: 'boolean',
			},
			teamId: {
				type: 'string',
			},
			teamDefault: {
				type: 'boolean',
			},
			open: {
				type: 'boolean',
			},
			autoTranslateLanguage: {
				type: 'string',
			},
			autoTranslate: {
				type: 'boolean',
			},
			unread: {
				type: 'integer',
			},
			alert: {
				type: 'boolean',
			},
			hideUnreadStatus: {
				type: 'boolean',
			},
			hideMentionStatus: {
				type: 'boolean',
			},
			muted: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
			unmuted: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
			usernames: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
			ts: {
				type: 'string',
				format: 'date-time',
			},
			cl: {
				type: 'boolean',
			},
			ro: {
				type: 'boolean',
			},
			favorite: {
				type: 'boolean',
			},
			archived: {
				type: 'boolean',
			},
			description: {
				type: 'string',
			},
			createdOTR: {
				type: 'boolean',
			},
			e2eKeyId: {
				type: 'string',
			},
			federated: {
				type: 'boolean',
			},
			customFields: {
				type: 'object',
				additionalProperties: true,
			},
			channel: {
				type: 'object',
				properties: {
					_id: {
						type: 'string',
					},
				},
			},
		},
		required: ['_id', 't', 'msgs', 'u', 'usersCount'],
	},
	IUser: {
		type: 'object',
		properties: {
			_id: {
				type: 'string',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
			},
			roles: {
				type: 'array',
				items: {
					type: 'string',
					description: "IRole['_id']",
				},
			},
			type: {
				type: 'string',
			},
			active: {
				type: 'boolean',
			},
			username: {
				type: 'string',
			},
			nickname: {
				type: 'string',
			},
			name: {
				type: 'string',
			},
			services: {
				$ref: '#/components/schemas/IUserServices',
			},
			emails: {
				type: 'array',
				items: {
					$ref: '#/components/schemas/IUserEmail',
				},
			},
			status: {
				type: 'string',
				description: 'UserStatus',
			},
			statusConnection: {
				type: 'string',
			},
			lastLogin: {
				type: 'string',
				format: 'date-time',
			},
			bio: {
				type: 'string',
			},
			avatarOrigin: {
				type: 'string',
			},
			avatarETag: {
				type: 'string',
			},
			avatarUrl: {
				type: 'string',
			},
			utcOffset: {
				type: 'number',
			},
			language: {
				type: 'string',
			},
			statusDefault: {
				type: 'string',
				description: 'UserStatus',
			},
			statusText: {
				type: 'string',
			},
			oauth: {
				type: 'object',
				properties: {
					authorizedClients: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
				},
			},
			_updatedAt: {
				type: 'string',
				format: 'date-time',
			},
			e2e: {
				type: 'object',
				properties: {
					private_key: {
						type: 'string',
					},
					public_key: {
						type: 'string',
					},
				},
			},
			requirePasswordChange: {
				type: 'boolean',
			},
			customFields: {
				type: 'object',
				additionalProperties: true,
			},
			settings: {
				$ref: '#/components/schemas/IUserSettings',
			},
			defaultRoom: {
				type: 'string',
			},
			ldap: {
				type: 'boolean',
			},
			extension: {
				type: 'string',
			},
			inviteToken: {
				type: 'string',
			},
			canViewAllInfo: {
				type: 'boolean',
			},
			phone: {
				type: 'string',
			},
			reason: {
				type: 'string',
			},
			federated: {
				type: 'boolean',
			},
			federation: {
				type: 'object',
				properties: {
					avatarUrl: {
						type: 'string',
					},
					searchedServerNames: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
				},
			},
			banners: {
				type: 'object',
				additionalProperties: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
						},
						priority: {
							type: 'number',
						},
						title: {
							type: 'string',
						},
						text: {
							type: 'string',
						},
						textArguments: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
						modifiers: {
							type: 'array',
							items: {
								type: 'string',
								enum: ['large', 'danger'],
							},
						},
						link: {
							type: 'string',
						},
						read: {
							type: 'boolean',
						},
					},
				},
			},
			importIds: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
			_pendingAvatarUrl: {
				type: 'string',
			},
		},
		required: ['_id', 'createdAt', 'roles', 'type', 'active', '_updatedAt'],
	},
	IUpload: {
		type: 'object',
		properties: {
			_id: {
				type: 'string',
			},
			typeGroup: {
				type: 'string',
			},
			description: {
				type: 'string',
			},
			type: {
				type: 'string',
			},
			name: {
				type: 'string',
			},
			aliases: {
				type: 'string',
			},
			extension: {
				type: 'string',
			},
			complete: {
				type: 'boolean',
			},
			rid: {
				type: 'string',
			},
			uid: {
				type: 'string',
			},
			uploading: {
				type: 'boolean',
			},
			userId: {
				type: 'string',
			},
			progress: {
				type: 'number',
			},
			etag: {
				type: 'string',
			},
			size: {
				type: 'number',
			},
			identify: {
				type: 'object',
				properties: {
					format: {
						type: 'string',
					},
					size: {
						type: 'object',
						properties: {
							width: {
								type: 'number',
							},
							height: {
								type: 'number',
							},
						},
					},
				},
			},
			store: {
				type: 'string',
			},
			path: {
				type: 'string',
			},
			token: {
				type: 'string',
			},
			uploadedAt: {
				type: 'string',
				format: 'date-time',
			},
			modifiedAt: {
				type: 'string',
				format: 'date-time',
			},
			url: {
				type: 'string',
			},
			originalStore: {
				type: 'string',
			},
			originalId: {
				type: 'string',
			},
			message_id: {
				type: 'string',
			},
			instanceId: {
				type: 'string',
			},
			AmazonS3: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
					},
				},
			},
			s3: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
					},
				},
			},
			GoogleStorage: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
					},
				},
			},
			googleCloudStorage: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
					},
				},
			},
			Webdav: {
				type: 'object',
				properties: {
					path: {
						type: 'string',
					},
				},
			},
		},
		required: ['_id'],
	},
	IMessage: {
		type: 'object',
		properties: {
			rid: {
				type: 'string',
				description: 'RoomID',
			},
			msg: {
				type: 'string',
			},
			tmid: {
				type: 'string',
			},
			tshow: {
				type: 'boolean',
			},
			ts: {
				type: 'string',
				format: 'date-time',
			},
			mentions: {
				type: 'array',
				items: {
					$ref: '#/components/schemas/MessageMention',
				},
			},
			groupable: {
				type: 'boolean',
			},
			channels: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
						},
						name: {
							type: 'string',
						},
					},
				},
			},
			u: {
				type: 'object',
				properties: {
					_id: {
						type: 'string',
					},
					username: {
						type: 'string',
					},
					name: {
						type: 'string',
					},
				},
				required: ['_id', 'username'],
			},
			blocks: {
				$ref: '#/components/schemas/MessageSurfaceLayout',
			},
			alias: {
				type: 'string',
			},
			md: {
				$ref: '#/components/schemas/Root',
			},
			_hidden: {
				type: 'boolean',
			},
			imported: {
				type: 'boolean',
			},
			replies: {
				type: 'array',
				items: {
					type: 'string',
					description: "IUser['_id']",
				},
			},
			location: {
				type: 'object',
				properties: {
					type: {
						type: 'string',
						enum: ['Point'],
					},
					coordinates: {
						type: 'array',
						items: {
							type: 'number',
						},
						minItems: 2,
						maxItems: 2,
					},
				},
			},
			starred: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
							description: "IUser['_id']",
						},
					},
				},
			},
			pinned: {
				type: 'boolean',
			},
			pinnedAt: {
				type: 'string',
				format: 'date-time',
			},
			pinnedBy: {
				type: 'object',
				properties: {
					_id: {
						type: 'string',
					},
					username: {
						type: 'string',
					},
				},
			},
			unread: {
				type: 'boolean',
			},
			temp: {
				type: 'boolean',
			},
			drid: {
				type: 'string',
				description: 'RoomID',
			},
			tlm: {
				type: 'string',
				format: 'date-time',
			},
			dcount: {
				type: 'integer',
			},
			tcount: {
				type: 'integer',
			},
			t: {
				type: 'string',
				description: 'MessageTypesValues',
			},
			e2e: {
				type: 'string',
				enum: ['pending', 'done'],
			},
			otrAck: {
				type: 'string',
			},
			urls: {
				type: 'array',
				items: {
					$ref: '#/components/schemas/MessageUrl',
				},
			},
			actionLinks: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						icon: {
							type: 'string',
							description: 'keyof typeof Icons',
						},
						i18nLabel: {
							type: 'string',
						},
						label: {
							type: 'string',
						},
						method_id: {
							type: 'string',
						},
						params: {
							type: 'string',
						},
					},
				},
				deprecated: true,
			},
			file: {
				$ref: '#/components/schemas/FileProp',
				deprecated: true,
			},
			fileUpload: {
				type: 'object',
				properties: {
					publicFilePath: {
						type: 'string',
					},
					type: {
						type: 'string',
					},
					size: {
						type: 'number',
					},
				},
			},
			files: {
				type: 'array',
				items: {
					$ref: '#/components/schemas/FileProp',
				},
			},
			attachments: {
				type: 'array',
				items: {
					$ref: '#/components/schemas/MessageAttachment',
				},
			},
			reactions: {
				type: 'object',
				additionalProperties: {
					type: 'object',
					properties: {
						names: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
						usernames: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
						federationReactionEventIds: {
							type: 'object',
							additionalProperties: {
								type: 'string',
							},
						},
					},
				},
			},
			private: {
				type: 'boolean',
			},
			bot: {
				type: 'boolean',
			},
			sentByEmail: {
				type: 'boolean',
			},
			webRtcCallEndTs: {
				type: 'string',
				format: 'date-time',
			},
			role: {
				type: 'string',
			},
			avatar: {
				type: 'string',
			},
			emoji: {
				type: 'string',
			},
			tokens: {
				type: 'array',
				items: {
					$ref: '#/components/schemas/Token',
				},
			},
			html: {
				type: 'string',
			},
			token: {
				type: 'string',
			},
			federation: {
				type: 'object',
				properties: {
					eventId: {
						type: 'string',
					},
				},
			},
			slaData: {
				type: 'object',
				properties: {
					definedBy: {
						type: 'object',
						properties: {
							_id: {
								type: 'string',
							},
							username: {
								type: 'string',
							},
						},
					},
					sla: {
						type: 'object',
						properties: {
							name: {
								type: 'string',
							},
						},
					},
				},
			},
			priorityData: {
				type: 'object',
				properties: {
					definedBy: {
						type: 'object',
						properties: {
							_id: {
								type: 'string',
							},
							username: {
								type: 'string',
							},
						},
					},
					priority: {
						type: 'object',
						properties: {
							name: {
								type: 'string',
							},
							i18n: {
								type: 'string',
							},
						},
					},
				},
			},
			customFields: {
				$ref: '#/components/schemas/IMessageCustomFields',
			},
		},
		required: ['rid', 'msg', 'ts', 'u'],
	},
	ITeam: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
			},
			type: {
				type: 'string',
				description: 'TEAM_TYPE',
			},
			roomId: {
				type: 'string',
			},
			createdBy: {
				type: 'object',
				properties: {
					_id: {
						type: 'string',
					},
					username: {
						type: 'string',
					},
				},
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
			},
		},
		required: ['name', 'type', 'roomId', 'createdBy', 'createdAt'],
	},
	IProviderMetadata: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
			},
			displayName: {
				type: 'string',
			},
			settings: {
				type: 'object',
				properties: {
					apiKey: {
						type: 'string',
					},
					apiEndPointUrl: {
						type: 'string',
					},
				},
				required: ['apiKey', 'apiEndPointUrl'],
			},
		},
		required: ['name', 'displayName', 'settings'],
	},
	IDeepLTranslation: {
		type: 'object',
		properties: {
			detected_source_language: {
				type: 'string',
			},
			text: {
				type: 'string',
			},
		},
		required: ['detected_source_language', 'text'],
	},
	IGoogleTranslation: {
		type: 'object',
		properties: {
			translatedText: {
				type: 'string',
			},
		},
		required: ['translatedText'],
	},
	ISupportedLanguage: {
		type: 'object',
		properties: {
			language: {
				type: 'string',
			},
			name: {
				type: 'string',
			},
		},
		required: ['language', 'name'],
	},
	ISupportedLanguages: {
		type: 'object',
		additionalProperties: {
			type: 'array',
			items: {
				$ref: '#/components/schemas/ISupportedLanguage',
			},
		},
	},
	ITranslationResult: {
		type: 'object',
		additionalProperties: {
			type: 'string',
		},
	},
	Token: {
		type: 'object',
		properties: {
			token: {
				type: 'string',
			},
			text: {
				type: 'string',
			},
			type: {
				type: 'string',
				enum: ['user', 'team'],
			},
			noHtml: {
				type: 'string',
			},
			highlight: {
				type: 'boolean',
			},
		},
		required: ['token', 'text'],
		additionalProperties: true,
	},
	TokenExtra: {
		type: 'object',
		properties: {
			highlight: {
				type: 'boolean',
			},
			noHtml: {
				type: 'string',
			},
		},
		additionalProperties: true,
	},
	MessageMention: {
		type: 'object',
		properties: {
			type: {
				type: 'string',
				enum: ['user', 'team'],
			},
			_id: {
				type: 'string',
			},
			name: {
				type: 'string',
			},
			username: {
				type: 'string',
			},
			fname: {
				type: 'string',
			},
		},
		required: ['_id'],
		additionalProperties: true,
	},
	IMessageCustomFields: {
		type: 'object',
		additionalProperties: true,
	},
	IEditedMessage: {
		type: 'object',
		properties: {
			editedAt: {
				type: 'string',
				format: 'date-time',
			},
			editedBy: {
				type: 'object',
				properties: {
					_id: {
						type: 'string',
					},
					username: {
						type: 'string',
					},
				},
				required: ['_id', 'username'],
			},
		},
		required: ['editedAt', 'editedBy'],
		allOf: [
			{
				$ref: '#/components/schemas/IMessage',
			},
		],
	},
	IInvite: {
		type: 'object',
		properties: {
			days: {
				type: 'number',
			},
			maxUses: {
				type: 'number',
			},
			rid: {
				type: 'string',
			},
			userId: {
				type: 'string',
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
			},
			expires: {
				anyOf: [
					{
						type: 'string',
						format: 'date-time',
					},
					{
						type: 'null',
					},
				],
			},
			uses: {
				type: 'number',
			},
			url: {
				type: 'string',
			},
		},
		required: ['days', 'maxUses', 'rid', 'userId', 'createdAt', 'uses', 'url'],
		allOf: [
			{
				$ref: '#/components/schemas/IRocketChatRecord',
			},
		],
	},
	IBanner: {
		type: 'object',
		properties: {
			platform: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
			expireAt: {
				type: 'string',
				format: 'date-time',
			},
			startAt: {
				type: 'string',
				format: 'date-time',
			},
			roles: {
				type: 'array',
				items: {
					type: 'string',
				},
				description: 'Deprecated: a new `selector` field should be created for filtering instead',
			},
			createdBy: {
				type: 'object',
				properties: {
					_id: {
						type: 'string',
					},
					username: {
						type: 'string',
					},
				},
				required: ['_id', 'username'],
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
			},
			view: {
				type: 'string',
			},
			active: {
				type: 'boolean',
			},
			inactivedAt: {
				type: 'string',
				format: 'date-time',
			},
			snapshot: {
				type: 'string',
			},
			dictionary: {
				type: 'object',
				additionalProperties: {
					type: 'string',
				},
			},
			surface: {
				type: 'string',
				enum: ['banner', 'modal'],
			},
		},
		required: ['platform', 'expireAt', 'startAt', 'createdBy', 'createdAt', 'view', 'surface'],
	},
};
