var _ = module.exports;

_.hostname = (function() {
  var ip = false;
  var net = require('os').networkInterfaces();

  Object.keys(net).every(function(key) {
    var detail = net[key];
    Object.keys(detail).every(function(i) {
      var address = String(detail[i].address).trim();
      if (address && /^\d+(?:\.\d+){3}$/.test(address) && address !== '127.0.0.1') {
        ip = address;
      }
      return !ip; // 找到了，则跳出循环
    });
    return !ip; // 找到了，则跳出循环
  });
  return ip || 'unknown';
})();

_.open = function(path, callback) {
  var child_process = require('child_process');
  var cmd = fis.util.escapeShellArg(path);
  if (fis.util.isWin()) {
    cmd = 'start "" ' + cmd;
  } else {
    if (process.env['XDG_SESSION_COOKIE'] ||
      process.env['XDG_CONFIG_DIRS'] ||
      process.env['XDG_CURRENT_DESKTOP']) {
      cmd = 'xdg-open ' + cmd;
    } else if (process.env['GNOME_DESKTOP_SESSION_ID']) {
      cmd = 'gnome-open ' + cmd;
    } else {
      cmd = 'open ' + cmd;
    }
  }
  child_process.exec(cmd, callback);
};

_.matchVersion = function(str) {
  var version = false;
  var reg = /\b\d+(\.\d+){2}/;
  var match = str.match(reg);
  if (match) {
    version = match[0];
  }
  return version;
};

_.getRCFile = function() {
  return fis.project.getTempPath('server/conf.json');
};

_.getPidFile = function() {
  return fis.project.getTempPath('server/pid');
};

_.pid = function(value) {
  var pidFile = _.getPidFile();

  if (arguments.length) {
    return value ? fis.util.write(pidFile, value) : fis.util.fs.unlinkSync(pidFile);
  } else {

    if (fis.util.exists(pidFile)) {
      return fis.util.fs.readFileSync(pidFile, 'utf8').trim();
    }

    return 0;
  }
};

_.serverInfo = function(options) {
  var conf = _.getRCFile();

  if (arguments.length) {

    // setter
    return options && fis.util.write(conf, JSON.stringify(options, null, 2));
  } else {

    // getter
    return fis.util.isFile(conf) ? require(conf) : null;
  }
};

_.getDefaultServerRoot = function() {
  var key = 'FIS_SERVER_DOCUMENT_ROOT';

  if (process.env && process.env[key]) {
    var path = process.env[key];

    // 如果指定的是一个文件，应该报错。
    if (fis.util.exists(path) && !fis.util.isDir(path)) {
      fis.log.error('invalid environment variable [%s] of document root [%s]', key, root);
    }

    return path;
  }

  return fis.project.getTempPath('www');
};

_.getProjectConfig = function() {
  var temp = fis.config.get('project.test')?fis.config.get('project.test'):'test-config.js';
  var conf = fis.project.getProjectPath(temp);
  return fis.util.isFile(conf) ? require(conf) : {};
}

_.printObject = function(o, prefix) {
  prefix = prefix || '';
  for (var key in o) {
    if (o.hasOwnProperty(key)) {
      if (typeof o[key] === 'object') {
        _.printObject(o[key], prefix + key + '.');
      } else {
        console.log(prefix + key + '=' + o[key]);
      }
    }
  }
};
