import { expect } from 'chai';

import {
	toInternalMessageFormat,
	toInternalQuoteMessageFormat,
} from '../../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/converters/MessageTextParser';

describe('Federation - Infrastructure - Matrix - RocketTextParser', () => {
	describe('#toInternalMessageFormat ()', () => {
		it('should parse the user mention correctly', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: 'hey User Real Name',
					formattedMessage: 'hey <a href="https://matrix.to/#/@user:server.com">User Real Name</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @user:server.com');
		});

		it('should parse the @all mention correctly', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: 'hey externalRoomId',
					formattedMessage: 'hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @all');
		});

		it('should parse the @here mention correctly', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: 'hey externalRoomId',
					formattedMessage: 'hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @all');
		});

		it('should parse the @user mention without to include the server name when the user is original from the local ', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: 'hey User Real Name',
					formattedMessage: 'hey <a href="https://matrix.to/#/@user:localDomain">User Real Name</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @user');
		});

		it('should return the message as-is when it does not have any mention', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: 'hey people, how are you?',
					formattedMessage: 'hey people, how are you?',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey people, how are you?');
		});

		it('should parse the message with all the mentions correctly when an user has the same real name', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: `hey User Real Name, hey Remote User Real Name, hey Remote User Real Name, how are you? Hope **you** __are__ doing well`,
					formattedMessage:
						'<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, hey <a href="https://matrix.to/#/@remoteuser1:matrix.org">Remote User Real Name</a>,  hey <a href="https://matrix.to/#/@remoteuser2:matrix.org">Remote User Real Name</a> how are you? Hope <strong>you</strong> <strong>are</strong> doing well',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(`hey @user, hey @remoteuser1:matrix.org, hey @remoteuser2:matrix.org, how are you? Hope **you** __are__ doing well`);
		});

		it('should parse correctly a message containing both local mentions + some markdown', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: `hey User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item`,
					formattedMessage:
						'<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item </code></pre>',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(`hey @user, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item`);
		});

		it('should parse correctly a message containing both external mentions + some markdown', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: `hey, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item`,
					formattedMessage:
						'<p>hey, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item </code></pre>',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(`hey, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item`);
		});

		it('should parse correctly a message containing both local mentions + external mentions + some markdown', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: `hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item`,
					formattedMessage:
						'<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item </code></pre>',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(`hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item`);
		});

		it('should parse correctly a message containing both mentions + some quoting inside the message', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: `hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item
					
					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet 
					`,
					formattedMessage:
						'<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item &gt; Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet </code></pre>',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(`hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item
					
					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet`);
		});

		it('should parse correctly a message containing both mentions + some quoting inside the message + an email inside the message', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: `hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item
					
					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet 

					marcos.defendi@email.com
					`,
					formattedMessage:
						'<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item &gt; Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet marcos.defendi@email.com </code></pre>',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(`hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item
					
					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet 

					marcos.defendi@email.com`);
		});

		it('should parse correctly a message containing a message with mentions + the whole markdown spec', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: `hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see:
					# Heading 1 

					**Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					## Heading 2

					_Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla.

					### Heading 3 

					- Lists, Links and elements

					**Unordered List** 
					- List Item 1 
					- List Item 2 
					- List Item 3 
					- List Item 4

					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item 

					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					**Links:** 

					[Google](google.com)
					[Rocket.Chat](rocket.chat)
					[Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					marcos.defendi@rocket.chat 
					+55991999999 
					\`Inline code\`
					\`\`\`typescript 
					const applyMarkdownIfRequires = ( list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'], key: MarkdownFields, text: string, variant: 'inline' | 'inlineWithoutBreaks' | 'document' = 'inline', ): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text); 
					\`\`\`

				`,
					formattedMessage:
						'<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see: # Heading 1 </p> <pre><code> **Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. ## Heading 2 _Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. ### Heading 3 - Lists, Links and elements **Unordered List** - List Item 1 - List Item 2 - List Item 3 - List Item 4 **Ordered List** 1. List Item 2. List Item 3. List Item 4. List Item &gt; Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. **Links:** [Google](google.com) [Rocket.Chat](rocket.chat) [Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) marcos.defendi@rocket.chat +55991999999 `Inline code` ```typescript const applyMarkdownIfRequires = ( list: MessageAttachmentDefault[&#39;mrkdwn_in&#39;] = [&#39;text&#39;, &#39;pretext&#39;], key: MarkdownFields, text: string, variant: &#39;inline&#39; | &#39;inlineWithoutBreaks&#39; | &#39;document&#39; = &#39;inline&#39;, ): ReactNode =&gt; (list?.includes(key) ? &lt;MarkdownText parseEmoji variant={variant} content={text} /&gt; : text); ``` </code></pre>',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(`hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see:
					# Heading 1 

					**Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					## Heading 2

					_Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla.

					### Heading 3 

					- Lists, Links and elements

					**Unordered List** 
					- List Item 1 
					- List Item 2 
					- List Item 3 
					- List Item 4

					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item 

					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					**Links:** 

					[Google](google.com)
					[Rocket.Chat](rocket.chat)
					[Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					marcos.defendi@rocket.chat 
					+55991999999 
					\`Inline code\`
					\`\`\`typescript 
					const applyMarkdownIfRequires = ( list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'], key: MarkdownFields, text: string, variant: 'inline' | 'inlineWithoutBreaks' | 'document' = 'inline', ): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text); 
					\`\`\``);
		});

		it('should parse correctly a message containing a message with mentions + the whole markdown spec + emojis', async () => {
			expect(
				await toInternalMessageFormat({
					rawMessage: `hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see:
					# Heading 1 

					**Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					## Heading 2

					_Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla.

					### Heading 3 

					- Lists, Links and elements

					**Unordered List** 
					- List Item 1 
					- List Item 2 
					- List Item 3 
					- List Item 4

					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item 

					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					**Links:** 

					[Google](google.com)
					[Rocket.Chat](rocket.chat)
					[Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					marcos.defendi@rocket.chat 
					+55991999999 
					\`Inline code\`
					\`\`\`typescript 
					const applyMarkdownIfRequires = ( list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'], key: MarkdownFields, text: string, variant: 'inline' | 'inlineWithoutBreaks' | 'document' = 'inline', ): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text); 
					\`\`\`
					😀
					😀
					😀
					😀
				`,
					formattedMessage:
						'<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see: # Heading 1 </p> <pre><code> **Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. ## Heading 2 _Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. ### Heading 3 - Lists, Links and elements **Unordered List** - List Item 1 - List Item 2 - List Item 3 - List Item 4 **Ordered List** 1. List Item 2. List Item 3. List Item 4. List Item &gt; Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. **Links:** [Google](google.com) [Rocket.Chat](rocket.chat) [Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) marcos.defendi@rocket.chat +55991999999 `Inline code` ```typescript const applyMarkdownIfRequires = ( list: MessageAttachmentDefault[&#39;mrkdwn_in&#39;] = [&#39;text&#39;, &#39;pretext&#39;], key: MarkdownFields, text: string, variant: &#39;inline&#39; | &#39;inlineWithoutBreaks&#39; | &#39;document&#39; = &#39;inline&#39;, ): ReactNode =&gt; (list?.includes(key) ? &lt;MarkdownText parseEmoji variant={variant} content={text} /&gt; : text); ``` 😀 😀 😀 😀 </code></pre>',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(`hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see:
					# Heading 1 

					**Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					## Heading 2

					_Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla.

					### Heading 3 

					- Lists, Links and elements

					**Unordered List** 
					- List Item 1 
					- List Item 2 
					- List Item 3 
					- List Item 4

					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item 

					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					**Links:** 

					[Google](google.com)
					[Rocket.Chat](rocket.chat)
					[Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					marcos.defendi@rocket.chat 
					+55991999999 
					\`Inline code\`
					\`\`\`typescript 
					const applyMarkdownIfRequires = ( list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'], key: MarkdownFields, text: string, variant: 'inline' | 'inlineWithoutBreaks' | 'document' = 'inline', ): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text); 
					\`\`\`
					😀
					😀
					😀
					😀`);
		});
	});

	describe('#toInternalQuoteMessageFormat ()', () => {
		const homeServerDomain = 'localDomain.com';
		const quotedMessage = `<mx-reply><blockquote><a href="https://matrix.to/#/externalRoomId/eventToReplyToId">In reply to</a> <a href="https://matrix.to/#/originalEventSender">originalEventSender</a><br /></blockquote></mx-reply>`;
		it('should parse the external quote to the internal one correctly', async () => {
			const rawMessage = '> <@originalEventSender:localDomain.com> Quoted message\n\n hey people, how are you?';
			const formattedMessage = `${quotedMessage}hey people, how are you?`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey people, how are you?`);
		});

		it('should parse the user mention correctly', async () => {
			const rawMessage = '> <@originalEventSender:localDomain.com> Quoted message\n\n hey User Real Name';
			const formattedMessage = `${quotedMessage}hey <a href="https://matrix.to/#/@user:server.com">User Real Name</a>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be.equal('[ ](http://localhost:3000/group/1?msg=2354543564) hey @user:server.com');
		});

		it('should parse the @all mention correctly', async () => {
			const rawMessage = '> <@originalEventSender:localDomain.com> Quoted message\n\n hey externalRoomId';
			const formattedMessage = `${quotedMessage}hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be.equal('[ ](http://localhost:3000/group/1?msg=2354543564) hey @all');
		});

		it('should parse the message with all the mentions correctly when an user has the same real name', async () => {
			const rawMessage =
				'> <@originalEventSender:localDomain.com> Quoted message\n\n hey User Real Name, hey Remote User Real Name, hey Remote User Real Name, how are you? Hope **you** __are__ doing well';
			const formattedMessage = `${quotedMessage}<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, hey <a href="https://matrix.to/#/@remoteuser1:matrix.org">Remote User Real Name</a>,  hey <a href="https://matrix.to/#/@remoteuser2:matrix.org">Remote User Real Name</a> how are you? Hope <strong>you</strong> <strong>are</strong> doing well`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be.equal(
				`[ ](http://localhost:3000/group/1?msg=2354543564) hey @user, hey @remoteuser1:matrix.org, hey @remoteuser2:matrix.org, how are you? Hope **you** __are__ doing well`,
			);
		});

		it('should parse correctly a message containing both local mentions + some markdown', async () => {
			const rawMessage = `> <@originalEventSender:localDomain.com> Quoted message\n\n hey User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
							# List 1:
							**Ordered List** 

							1. List Item 
							2. List Item 
							3. List Item 
							4. List Item`;
			const formattedMessage = `${quotedMessage}<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item </code></pre>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be
				.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey @user, how are you? Hope **you** __are__ doing well, please see the list:
							# List 1:
							**Ordered List** 

							1. List Item 
							2. List Item 
							3. List Item 
							4. List Item`);
		});

		it('should parse correctly a message containing both external mentions + some markdown', async () => {
			const rawMessage = `> <@originalEventSender:localDomain.com> Quoted message\n\n hey, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
							# List 1:
							**Ordered List** 

							1. List Item 
							2. List Item 
							3. List Item 
							4. List Item`;
			const formattedMessage = `${quotedMessage}<p>hey, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item </code></pre>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be
				.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see the list:
							# List 1:
							**Ordered List** 

							1. List Item 
							2. List Item 
							3. List Item 
							4. List Item`);
		});

		it('should parse correctly a message containing both local mentions + external mentions + some markdown', async () => {
			const rawMessage = `> <@originalEventSender:localDomain.com> Quoted message\n\n hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
						# List 1:
						**Ordered List** 

						1. List Item 
						2. List Item 
						3. List Item 
						4. List Item`;
			const formattedMessage = `${quotedMessage}<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item </code></pre>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be
				.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see the list:
						# List 1:
						**Ordered List** 

						1. List Item 
						2. List Item 
						3. List Item 
						4. List Item`);
		});

		it('should parse correctly a message containing both mentions + some quoting inside the message', async () => {
			const rawMessage = `> <@originalEventSender:localDomain.com> Quoted message\n\n hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item
					
					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet 
					`;
			const formattedMessage = `${quotedMessage}<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item &gt; Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet </code></pre>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be
				.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item
					
					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet`);
		});

		it('should parse correctly a message containing both mentions + some quoting inside the message + an email inside the message', async () => {
			const rawMessage = `> <@originalEventSender:localDomain.com> Quoted message\n\n hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item
					
					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet 

					marcos.defendi@email.com
					`;
			const formattedMessage = `${quotedMessage}<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see the list: # List 1: <strong>Ordered List</strong> </p> <pre><code> 1. List Item 2. List Item 3. List Item 4. List Item &gt; Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet marcos.defendi@email.com </code></pre>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be
				.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see the list:
					# List 1:
					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item
					
					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet 

					marcos.defendi@email.com`);
		});

		it('should parse correctly a message containing a message with mentions + the whole markdown spec', async () => {
			const rawMessage = `> <@originalEventSender:localDomain.com> Quoted message\n\n hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see:
					# Heading 1 

					**Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					## Heading 2

					_Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla.

					### Heading 3 

					- Lists, Links and elements

					**Unordered List** 
					- List Item 1 
					- List Item 2 
					- List Item 3 
					- List Item 4

					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item 

					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					**Links:** 

					[Google](google.com)
					[Rocket.Chat](rocket.chat)
					[Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					marcos.defendi@rocket.chat 
					+55991999999 
					\`Inline code\`
					\`\`\`typescript 
					const applyMarkdownIfRequires = ( list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'], key: MarkdownFields, text: string, variant: 'inline' | 'inlineWithoutBreaks' | 'document' = 'inline', ): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text); 
					\`\`\`
			`;
			const formattedMessage = `${quotedMessage}<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see: # Heading 1 </p> <pre><code> **Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. ## Heading 2 _Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. ### Heading 3 - Lists, Links and elements **Unordered List** - List Item 1 - List Item 2 - List Item 3 - List Item 4 **Ordered List** 1. List Item 2. List Item 3. List Item 4. List Item &gt; Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. **Links:** [Google](google.com) [Rocket.Chat](rocket.chat) [Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) marcos.defendi@rocket.chat +55991999999 \`Inline code\` \`\`\`typescript const applyMarkdownIfRequires = ( list: MessageAttachmentDefault[&#39;mrkdwn_in&#39;] = [&#39;text&#39;, &#39;pretext&#39;], key: MarkdownFields, text: string, variant: &#39;inline&#39; | &#39;inlineWithoutBreaks&#39; | &#39;document&#39; = &#39;inline&#39;, ): ReactNode =&gt; (list?.includes(key) ? &lt;MarkdownText parseEmoji variant={variant} content={text} /&gt; : text); \`\`\` </code></pre>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be
				.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see:
					# Heading 1 

					**Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					## Heading 2

					_Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla.

					### Heading 3 

					- Lists, Links and elements

					**Unordered List** 
					- List Item 1 
					- List Item 2 
					- List Item 3 
					- List Item 4

					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item 

					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					**Links:** 

					[Google](google.com)
					[Rocket.Chat](rocket.chat)
					[Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					marcos.defendi@rocket.chat 
					+55991999999 
					\`Inline code\`
					\`\`\`typescript 
					const applyMarkdownIfRequires = ( list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'], key: MarkdownFields, text: string, variant: 'inline' | 'inlineWithoutBreaks' | 'document' = 'inline', ): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text); 
					\`\`\``);
		});

		it('should parse correctly a message containing a message with mentions + the whole markdown spec + emojis', async () => {
			const rawMessage = `> <@originalEventSender:localDomain.com> Quoted message\n\n hey User Real Name, here its Remote User Real Name, how are you? Hope **you** __are__ doing well, please see:
					# Heading 1 

					**Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					## Heading 2

					_Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla.

					### Heading 3 

					- Lists, Links and elements

					**Unordered List** 
					- List Item 1 
					- List Item 2 
					- List Item 3 
					- List Item 4

					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item 

					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					**Links:** 

					[Google](google.com)
					[Rocket.Chat](rocket.chat)
					[Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					marcos.defendi@rocket.chat 
					+55991999999 
					\`Inline code\`
					\`\`\`typescript 
					const applyMarkdownIfRequires = ( list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'], key: MarkdownFields, text: string, variant: 'inline' | 'inlineWithoutBreaks' | 'document' = 'inline', ): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text); 
					\`\`\`
					😀
					😀
					😀
					😀
		`;
			const formattedMessage = `${quotedMessage}<p>hey <a href="https://matrix.to/#/@user:localDomain.com">User Real Name</a>, here its <a href="https://matrix.to/#/@remoteuser:matrix.org">Remote User Real Name</a>, how are you? Hope <strong>you</strong> <strong>are</strong> doing well, please see: # Heading 1 </p> <pre><code> **Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. ## Heading 2 _Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. ### Heading 3 - Lists, Links and elements **Unordered List** - List Item 1 - List Item 2 - List Item 3 - List Item 4 **Ordered List** 1. List Item 2. List Item 3. List Item 4. List Item &gt; Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. **Links:** [Google](google.com) [Rocket.Chat](rocket.chat) [Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) [__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351) marcos.defendi@rocket.chat +55991999999 \`Inline code\` \`\`\`typescript const applyMarkdownIfRequires = ( list: MessageAttachmentDefault[&#39;mrkdwn_in&#39;] = [&#39;text&#39;, &#39;pretext&#39;], key: MarkdownFields, text: string, variant: &#39;inline&#39; | &#39;inlineWithoutBreaks&#39; | &#39;document&#39; = &#39;inline&#39;, ): ReactNode =&gt; (list?.includes(key) ? &lt;MarkdownText parseEmoji variant={variant} content={text} /&gt; : text); \`\`\` 😀 😀 😀 😀 </code></pre>`;

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					rawMessage,
					formattedMessage,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be
				.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey @user, here its @remoteuser:matrix.org, how are you? Hope **you** __are__ doing well, please see:
					# Heading 1 

					**Paragraph text**: **Bold** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					## Heading 2

					_Italict Text_: _Italict_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla.

					### Heading 3 

					- Lists, Links and elements

					**Unordered List** 
					- List Item 1 
					- List Item 2 
					- List Item 3 
					- List Item 4

					**Ordered List** 

					1. List Item 
					2. List Item 
					3. List Item 
					4. List Item 

					> Quote test: **Bold** _Italic_ Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sodales, enim et facilisis commodo, est augue venenatis ligula, in convallis erat felis nec nisi. In eleifend ligula a nunc efficitur, ut finibus enim fringilla. 

					**Links:** 

					[Google](google.com)
					[Rocket.Chat](rocket.chat)
					[Rocket.Chat Link Test](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[**Rocket.Chat Link Test**](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[~~Rocket.Chat Link Test~~](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__Rocket.Chat Link Test__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					[__**~~Rocket.Chat Link Test~~**__](https://desk.rocket.chat/support/rocketchat/ShowHomePage.do#Cases/dv/413244000073043351)
					marcos.defendi@rocket.chat 
					+55991999999 
					\`Inline code\`
					\`\`\`typescript 
					const applyMarkdownIfRequires = ( list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'], key: MarkdownFields, text: string, variant: 'inline' | 'inlineWithoutBreaks' | 'document' = 'inline', ): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text); 
					\`\`\`
					😀
					😀
					😀
					😀`);
		});
	});
});
