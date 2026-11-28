mod parser;

use napi_derive::napi;
use parser::{Parser, ParserConfig};

#[napi]
pub fn parse(input: String) -> napi::Result<serde_json::Value> {
    let config = ParserConfig::default();
    let result = Parser::parse(&input, config);
    serde_json::to_value(&result).map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[napi(js_name = "parseJson")]
pub fn parse_json(input: String) -> napi::Result<String> {
    let config = ParserConfig::default();
    let result = Parser::parse(&input, config);
    serde_json::to_string(&result).map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[napi(js_name = "parseFlat")]
pub fn parse_flat(input: String) -> napi::Result<napi::bindgen_prelude::Buffer> {
    let config = ParserConfig::default();
    let bytes = Parser::parse_flat(&input, config);
    Ok(bytes.into())
}
