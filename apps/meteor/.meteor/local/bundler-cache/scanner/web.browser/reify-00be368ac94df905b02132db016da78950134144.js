module.export({Logger:()=>Logger});let Levels;module.link("./levels",{Levels(v){Levels=v}},0);
/**
 * Logger.
 * @public
 */
class Logger {
    constructor(logger, category, label) {
        this.logger = logger;
        this.category = category;
        this.label = label;
    }
    error(content) {
        this.genericLog(Levels.error, content);
    }
    warn(content) {
        this.genericLog(Levels.warn, content);
    }
    log(content) {
        this.genericLog(Levels.log, content);
    }
    debug(content) {
        this.genericLog(Levels.debug, content);
    }
    genericLog(level, content) {
        this.logger.genericLog(level, this.category, this.label, content);
    }
    get level() {
        return this.logger.level;
    }
    set level(newLevel) {
        this.logger.level = newLevel;
    }
}
