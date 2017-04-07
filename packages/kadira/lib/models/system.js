var os = Npm.require('os');
var usage = Npm.require('pidusage');
var EventLoopMonitor = Npm.require('evloop-monitor');

SystemModel = function () {
  var self = this;
  this.startTime = Ntp._now();
  this.newSessions = 0;
  this.sessionTimeout = 1000 * 60 * 30; //30 min

  this.usageLookup = Kadira._wrapAsync(usage.stat.bind(usage));
  this.evloopMonitor = new EventLoopMonitor(200);
  this.evloopMonitor.start();
}

_.extend(SystemModel.prototype, KadiraModel.prototype);

SystemModel.prototype.buildPayload = function() {
  var metrics = {};
  var now = Ntp._now();
  metrics.startTime = Kadira.syncedDate.syncTime(this.startTime);
  metrics.endTime = Kadira.syncedDate.syncTime(now);

  metrics.sessions = _.keys(Meteor.default_server.sessions).length;
  metrics.memory = process.memoryUsage().rss / (1024*1024);
  metrics.newSessions = this.newSessions;
  this.newSessions = 0;

  var usage = this.getUsage();
  metrics.pcpu = usage.cpu;
  if(usage.cpuInfo) {
    metrics.cputime = usage.cpuInfo.cpuTime;
    metrics.pcpuUser = usage.cpuInfo.pcpuUser;
    metrics.pcpuSystem = usage.cpuInfo.pcpuSystem;
  }

  // track eventloop blockness
  metrics.pctEvloopBlock = this.evloopMonitor.status().pctBlock;

  this.startTime = now;
  return {systemMetrics: [metrics]};
};

SystemModel.prototype.getUsage = function() {
  var usage = this.usageLookup(process.pid) || {};
  Kadira.docSzCache.setPcpu(usage.cpu);
  return usage;
};

SystemModel.prototype.handleSessionActivity = function(msg, session) {
  if(msg.msg === 'connect' && !msg.session) {
    this.countNewSession(session);
  } else if(['sub', 'method'].indexOf(msg.msg) != -1) {
    if(!this.isSessionActive(session)) {
      this.countNewSession(session);
    }
  }
  session._activeAt = Date.now();
}

SystemModel.prototype.countNewSession = function(session) {
  if(!isLocalAddress(session.socket)) {
    this.newSessions++;
  }
}

SystemModel.prototype.isSessionActive = function(session) {
  var inactiveTime = Date.now() - session._activeAt;
  return inactiveTime < this.sessionTimeout;
}

// ------------------------------------------------------------------------- //

// http://regex101.com/r/iF3yR3/2
var isLocalHostRegex = /^(?:.*\.local|localhost)(?:\:\d+)?|127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/;

// http://regex101.com/r/hM5gD8/1
var isLocalAddressRegex = /^127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/;

function isLocalAddress (socket) {
  var host = socket.headers['host'];
  if(host) return isLocalHostRegex.test(host);
  var address = socket.headers['x-forwarded-for'] || socket.remoteAddress;
  if(address) return isLocalAddressRegex.test(address);
}
