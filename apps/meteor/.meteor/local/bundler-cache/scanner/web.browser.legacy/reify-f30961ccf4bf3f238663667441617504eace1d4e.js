var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Field,FieldLabel,FieldRow,FieldHint,FieldDescription,InputBox,Skeleton;module.link('@rocket.chat/fuselage',{Field:function(v){Field=v},FieldLabel:function(v){FieldLabel=v},FieldRow:function(v){FieldRow=v},FieldHint:function(v){FieldHint=v},FieldDescription:function(v){FieldDescription=v},InputBox:function(v){InputBox=v},Skeleton:function(v){Skeleton=v}},1);var Form;module.link('@rocket.chat/layout',{Form:function(v){Form=v}},2);


const FormSkeleton = () => {
    return (_jsxs(Form, { "aria-busy": true, children: [_jsx(Form.Header, { children: _jsx(Form.Title, { children: _jsx(Skeleton, {}) }) }), _jsx(Form.Container, {}), _jsxs(Field, { children: [_jsx(FieldLabel, { children: _jsx(Skeleton, {}) }), _jsx(FieldDescription, { children: _jsx(Skeleton, {}) }), _jsx(FieldRow, { children: _jsx(InputBox.Skeleton, {}) }), _jsx(FieldHint, { children: _jsx(Skeleton, {}) })] }), _jsx(Form.Footer, { children: _jsx(Skeleton, {}) })] }));
};
module.exportDefault(FormSkeleton);
//# sourceMappingURL=FormSkeleton.js.map