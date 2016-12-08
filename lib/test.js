var _ = fis.util;
var util = require('./util.js');
var server = module.exports;
var options = server._options = {};
var spawn = require('child_process').spawn;

var app = require('./test-app.js');

//console.log(fis.config.get('project.proxy'));
server.options = function(opts) {
  if (arguments.length) {
    _.assign(options, opts);
  } else {
    return options;
  }
};

// 加载插件，启动服务。
function start() {
  util.serverInfo(options);
  app.start(options, function(error, info) {
    if (error) {
      fis.log.throw = false;
      fis.log.error('fail to start server.\n\n %s', error);
      return;
    }

    var address = (options.https ? 'https' : 'http') + '://127.0.0.1' + (options.port == 80 ? '/' : ':' + options.port + '/');

    fis.log.notice('Browse %s', address.yellow.bold);
    fis.log.notice('Or browse %s', ((options.https ? 'https' : 'http') + '://' + util.hostname + (options.port == 80 ? '/' : ':' + options.port + '/')).yellow.bold);

    console.log();

    setTimeout(function() {
      options.browse ? util.open(address, function() {
        options.daemon && process.exit();
      }) : (options.daemon && process.exit());
    }, 200);
  });
}

// 根据 pid 检测子进程是否存在。
function checkPid(pid, callback) {
  var list, msg = '';
  var isWin = _.isWin();
  var serverInfo = util.serverInfo() || options;

  if (isWin) {
    list = spawn('tasklist');
  } else {
    list = spawn('ps', ['-A']);
  }

  list.stdout.on('data', function(chunk) {
    msg += chunk.toString('utf-8').toLowerCase();
  });

  list.on('exit', function() {
    var found = false;
    msg.split(/[\r\n]+/).forEach(function(item) {

      if (~item.indexOf('--type ' + serverInfo.type) || process.platform !== 'darwin') {
        var m = item.match(/\d+/);

        if (m && m[0] == pid) {
          found = true;
        }
      }
    });

    callback(found);
  });

  list.on('error', function(e) {
    if (isWin) {
      fis.log.error('fail to execute `tasklist` command, please add your system path (eg: C:\\Windows\\system32, you should replace `C` with your system disk) in %PATH%');
    } else {
      fis.log.error('fail to execute `ps` command.');
    }
  });
}

// 停止服务。
function stop(callback) {
  var pidFile = util.getPidFile();
  var isWin = _.isWin();
  var pid = util.pid();

  if (pid) {
    checkPid(pid, function(exists) {
      if (exists) {
        if (isWin) {
          // windows 貌似没有 gracefully 关闭。
          // 用 process.kill 会遇到进程关不了的情况，没有 exit 事件响应，原因不明！
          require('child_process').exec('taskkill /PID ' + pid + ' /T /F');
        } else {
          // try to gracefully kill it.
          process.kill(pid, 'SIGTERM');
        }

        // checkout it every half second.
        (function(done) {
          var start = Date.now();
          var timer = setTimeout(function() {
            var fn = arguments.callee;

            checkPid(pid, function(exists) {
              if (exists) {
                // 实在关不了，那就野蛮的关了它。
                if (Date.now() - start > 5000) {
                  try {
                    isWin ?
                      require('child_process').exec('taskkill /PID ' + pid + ' /T /F') :
                      process.kill(pid, 'SIGKILL');
                  } catch (e) {
                    // I dont care the error.
                  }

                  clearTimeout(timer);
                  done();
                  return;
                }
                timer = setTimeout(fn, 500);
              } else {
                done();
              }
            });
          }, 20);
        })(function() {
          fis.log.info('Shutdown with pid [%s]', pid);
          util.pid(0);
          callback && callback(null, true);
        });
      } else {
        callback && callback(null, false);
      }
    });
  } else {
    // pid 文件不存在，说明没有开启服务。
    callback && callback(null, false);
  }
}

server.start = function() {

  // 如果是非后台运行模式，则
  if (!options.daemon) {
    start();
  } else {
    stop(start);
  }
};

server.stop = function(callback) {
  stop(function(error, stoped) {
    if (!stoped) {
      fis.log.warn('The server is not runing.');
    }

    callback && callback.apply(this, arguments);
  });
};

// 输出服务器配置信息。
server.info = function() {
  var serverInfo = util.serverInfo() || options;

  console.log(); // 输出个空行。
  util.printObject(serverInfo, ' ');
};

// 打开服务器根目录。
server.open = function() {
  var serverInfo = util.serverInfo() || options;

  fis.log.notice('Browse %s\n', serverInfo.root.yellow.bold);
  util.open(serverInfo.root);
};

// 清空服务器目录。
server.clean = function() {
  var now = Date.now();
  var serverInfo = util.serverInfo() || options;

  process.stdout.write('\n δ '.bold.yellow);

  try {
    if (app.clean) {
      app.clean(serverInfo);
    } else {
      fis.util.del(serverInfo.root, options.include || fis.get('server.clean.include'), options.exclude || fis.get('server.clean.exclude', 'server.log'));
    }
  } catch (e) {
    fis.util.del(serverInfo.root, options.include || fis.get('server.clean.include'), options.exclude || fis.get('server.clean.exclude', 'server.log'));
  }

  process.stdout.write((Date.now() - now + 'ms').green.bold);
  process.stdout.write('\n');
};
