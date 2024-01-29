import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChannelsImagesProps = {
	roomId: string;
	startingFromId: string;
	count?: number;
	offset?: number;
};
const channelsImagesPropsSchema = {};
export const isChannelsImagesProps = ajv.compile<ChannelsImagesProps>(channelsImagesPropsSchema);
