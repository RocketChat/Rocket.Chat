import AppActionOverridesProvider from './AppActionOverridesProvider';
import MediaCallAppActionsProvider from './MediaCallAppActionsProvider';
import type { AppButtonInteractionHandler, MediaCallAppActionDescriptor } from '../context/MediaCallAppActionsContext';

type MockedMediaCallAppActionsProviderProps = {
	children: React.ReactNode;
	actions?: MediaCallAppActionDescriptor[];
	handleInteraction?: AppButtonInteractionHandler;
};

const MockedMediaCallAppActionsProvider = ({ children, actions, handleInteraction }: MockedMediaCallAppActionsProviderProps) => {
	return (
		<MediaCallAppActionsProvider
			actions={
				actions || [
					{
						appId: 'app-id',
						actionId: 'change-label',
						label: 'Click to change label',
					},
					{
						appId: 'app-id',
						actionId: 'change-variant',
						label: 'Click to change label AND variant',
					},
				]
			}
			handleInteraction={
				handleInteraction ||
				(({ button, sessionState }) => {
					console.log(`Action clicked in call state`, { button, sessionState });
					const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<AppButtonInteractionHandler>>>();
					setTimeout(() => {
						switch (button.actionId) {
							case 'change-label':
								resolve({ update: { label: 'Label changed!' } });
								break;
							case 'change-variant':
								resolve({ update: { label: 'Variant changed!', variant: 'danger' } });
								break;
							default:
								resolve({ update: { disabled: false } });
						}
					}, 500);
					return promise;
				})
			}
		>
			<AppActionOverridesProvider>{children}</AppActionOverridesProvider>
		</MediaCallAppActionsProvider>
	);
};

export default MockedMediaCallAppActionsProvider;
