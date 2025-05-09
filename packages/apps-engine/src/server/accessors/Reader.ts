import type {
    ICloudWorkspaceRead,
    IEnvironmentRead,
    ILivechatRead,
    IMessageRead,
    INotifier,
    IPersistenceRead,
    IRead,
    IRoomRead,
    IUploadRead,
    IUserRead,
    IVideoConferenceRead,
} from '../../definition/accessors';
import type { IContactRead } from '../../definition/accessors/IContactRead';
import type { IOAuthAppsReader } from '../../definition/accessors/IOAuthAppsReader';
import type { IRoleRead } from '../../definition/accessors/IRoleRead';
import type { IThreadRead } from '../../definition/accessors/IThreadRead';

export class Reader implements IRead {
    constructor(
        private env: IEnvironmentRead,
        private message: IMessageRead,
        private persist: IPersistenceRead,
        private room: IRoomRead,
        private user: IUserRead,
        private noti: INotifier,
        private livechat: ILivechatRead,
        private upload: IUploadRead,
        private cloud: ICloudWorkspaceRead,
        private videoConf: IVideoConferenceRead,
        private contactRead: IContactRead,

        private oauthApps: IOAuthAppsReader,
        private thread: IThreadRead,
        private role: IRoleRead,
    ) {}

    public getEnvironmentReader(): IEnvironmentRead {
        return this.env;
    }

    public getThreadReader(): IThreadRead {
        return this.thread;
    }

    public getMessageReader(): IMessageRead {
        return this.message;
    }

    public getPersistenceReader(): IPersistenceRead {
        return this.persist;
    }

    public getRoomReader(): IRoomRead {
        return this.room;
    }

    public getUserReader(): IUserRead {
        return this.user;
    }

    public getNotifier(): INotifier {
        return this.noti;
    }

    public getLivechatReader(): ILivechatRead {
        return this.livechat;
    }

    public getUploadReader(): IUploadRead {
        return this.upload;
    }

    public getCloudWorkspaceReader(): ICloudWorkspaceRead {
        return this.cloud;
    }

    public getVideoConferenceReader(): IVideoConferenceRead {
        return this.videoConf;
    }

    public getOAuthAppsReader(): IOAuthAppsReader {
        return this.oauthApps;
    }

    public getRoleReader(): IRoleRead {
        return this.role;
    }

    public getContactReader(): IContactRead {
        return this.contactRead;
    }
}
