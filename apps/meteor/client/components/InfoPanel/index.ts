import InfoPanel from './InfoPanel';
import InfoPanelAction from './InfoPanelAction';
import InfoPanelActionGroup from './InfoPanelActionGroup';
import InfoPanelAvatar from './InfoPanelAvatar';
import InfoPanelField from './InfoPanelField';
import InfoPanelLabel from './InfoPanelLabel';
import InfoPanelSection from './InfoPanelSection';
import InfoPanelText from './InfoPanelText';
import InfoPanelTitle from './InfoPanelTitle';

export default Object.assign(InfoPanel, {
	Title: InfoPanelTitle,
	Label: InfoPanelLabel,
	Text: InfoPanelText,
	Avatar: InfoPanelAvatar,
	Field: InfoPanelField,
	Action: InfoPanelAction,
	Section: InfoPanelSection,
	ActionGroup: InfoPanelActionGroup,
});
