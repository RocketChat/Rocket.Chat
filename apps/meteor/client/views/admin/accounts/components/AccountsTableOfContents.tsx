import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type TableOfContentsEntry = {
	id: string;
	label: string;
};

type AccountsTableOfContentsProps = {
	entries: TableOfContentsEntry[];
	activeId: string;
	onSelect: (id: string) => void;
};

const AccountsTableOfContents = ({ entries, activeId, onSelect }: AccountsTableOfContentsProps) => {
	const { t } = useTranslation();

	return (
		<Box is='aside' width='x240' flexShrink={0} pi={24} pb={24} borderInlineStartWidth='default' borderInlineStartColor='light'>
			<Box fontScale='micro' color='hint' mbe={16} style={{ textTransform: 'none' }}>
				{t('Accounts_TableOfContents_Title')}
			</Box>
			<Box is='nav'>
				{entries.map(({ id, label }) => {
					const isActive = id === activeId;
					return (
						<Box
							key={id}
							is='a'
							role='button'
							tabIndex={0}
							display='flex'
							alignItems='center'
							pb={8}
							pbs={8}
							mbe={4}
							pi={12}
							borderStartStartRadius='x4'
							borderEndStartRadius='x4'
							borderInlineStartWidth='x2'
							borderInlineStartColor={isActive ? 'stroke-highlight' : 'transparent'}
							color={isActive ? 'default' : 'hint'}
							fontScale={isActive ? 'p2m' : 'p2'}
							style={{ cursor: 'pointer' }}
							onClick={() => onSelect(id)}
							onKeyDown={(event: React.KeyboardEvent) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									onSelect(id);
								}
							}}
						>
							{label}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};

export default AccountsTableOfContents;
