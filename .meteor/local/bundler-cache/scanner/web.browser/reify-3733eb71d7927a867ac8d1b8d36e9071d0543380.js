module.export({getLogger:()=>getLogger,setLogger:()=>setLogger});// TYPES
// FUNCTIONS
var logger = console;
function getLogger() {
  return logger;
}
function setLogger(newLogger) {
  logger = newLogger;
}