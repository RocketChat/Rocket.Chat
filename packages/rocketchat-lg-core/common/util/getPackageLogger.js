/* global getPackageLogger:true, logger:true */
/* exported getPackageLogger, logger */

getPackageLogger = pkgName => ({
  error: (...args) => console.error(`[${pkgName}]`, ...args),
  info: (...args) => console.info(`[${pkgName}]`, ...args),
  log: (...args) => console.log(`[${pkgName}]`, ...args),
  warn: (...args) => console.warn(`[${pkgName}]`, ...args),
})

logger = getPackageLogger('lg-core')
