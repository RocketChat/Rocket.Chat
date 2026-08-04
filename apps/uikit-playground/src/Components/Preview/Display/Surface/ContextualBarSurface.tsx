import {
	Avatar,
	Box,
	Button,
	ButtonGroup,
	ContextualbarV2,
	ContextualbarV2Action,
	ContextualbarV2Footer,
	ContextualbarV2Header,
	ContextualbarV2Title,
} from '@rocket.chat/fuselage';
import { Scrollbars } from 'rc-scrollbars';
import type { ReactNode } from 'react';

export type ContextualBarSurfaceProps = { children: ReactNode };

const ContextualBarSurface = ({ children }: ContextualBarSurfaceProps) => (
	<ContextualbarV2>
		<ContextualbarV2Header>
			<Avatar url='data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==' />
			<ContextualbarV2Title>Contextual Bar</ContextualbarV2Title>
			<ContextualbarV2Action data-qa='ContextualbarActionClose' title='Close' name='cross' />
		</ContextualbarV2Header>

		<Box height='100%' padding='12px'>
			<Box height='100%' display='flex' flexShrink={1} flexDirection='column' flexGrow={1}>
				<Scrollbars
					autoHide
					autoHideTimeout={2000}
					autoHideDuration={500}
					style={{
						width: '100%',
						height: '100%',
						flexGrow: 1,
						overflowY: 'hidden',
					}}
					renderThumbVertical={({ style, ...props }) => (
						<div
							{...props}
							style={{
								...style,
								backgroundColor: 'rgba(0, 0, 0, 0.5)',
								borderRadius: '7px',
							}}
						/>
					)}
				>
					<div>{children}</div>
				</Scrollbars>
			</Box>
		</Box>

		<ContextualbarV2Footer>
			<ButtonGroup stretch>
				<Button>Cancel</Button>
				<Button primary>Submit</Button>
			</ButtonGroup>
		</ContextualbarV2Footer>
	</ContextualbarV2>
);

export default ContextualBarSurface;
