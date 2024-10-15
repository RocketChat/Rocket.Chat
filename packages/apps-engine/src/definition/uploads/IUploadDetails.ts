export interface IUploadDetails {
    /**
     * Full filename of the file, including extension name
     */
    name: string;
    /**
     * Size of the file
     */
    size: number;
    /**
     * MIME type of the file
     */
    type: string;
    /**
     * The id of the Room that the file will be uploaded to
     */
    rid: string;
    /**
     * The id of the user that performed the upload
     */
    userId: string;
    /**
     * The token of a Livechat visitor
     */
    visitorToken?: string;
}
