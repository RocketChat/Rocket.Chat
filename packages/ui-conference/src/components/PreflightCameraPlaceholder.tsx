import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

/**
 * How much of the tile's bottom edge the toggles float over. The placeholder centres in what is left above it,
 * or on a short tile the icon and its line of text land underneath the buttons.
 */
const TOGGLES_ZONE = 60;

export type PreflightCameraPlaceholderProps = {
	/** Whether the call will open with the camera on. */
	cam: boolean;
	note?: string;
};

/** What the preflight's camera tile shows until there is a camera, said in the future tense of the call it opens. */
const PreflightCameraPlaceholder = ({ cam, note }: PreflightCameraPlaceholderProps) => {
	const { t } = useTranslation();

	return (
		<Box
			display='flex'
			flexDirection='column'
			alignItems='center'
			justifyContent='center'
			width='100%'
			height='100%'
			style={{ paddingBlockEnd: TOGGLES_ZONE }}
		>
			<Icon name={cam ? 'video' : 'video-off'} size='x32' color='pure-white' />
			<Box fontScale='p2b' color='pure-white' marginBlockStart={8} textAlign='center' paddingInline={24}>
				{cam ? t('Your_camera_will_be_on') : t('Your_camera_will_be_off')}
			</Box>
			{note && (
				<Box fontScale='c1' color='hint' marginBlockStart={4} textAlign='center' paddingInline={24}>
					{note}
				</Box>
			)}
		</Box>
	);
};

export default PreflightCameraPlaceholder;
