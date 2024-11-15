let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let BigEmojiElement;module.link('./BigEmojiElement',{default(v){BigEmojiElement=v}},1);

const BigEmojiBlock = ({ emoji }) => (_jsx("div", { role: 'presentation', children: emoji.map((emoji, index) => (_jsx(BigEmojiElement, Object.assign({}, emoji), index))) }));
module.exportDefault(BigEmojiBlock);
//# sourceMappingURL=BigEmojiBlock.js.map