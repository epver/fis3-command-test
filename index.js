var _ = fis.util;
var test = require('./lib/test.js');
var util = require('./lib/util.js');

exports.name = 'test <command> [options]';

exports.desc = 'launch a test server';

exports.commands = {
  'start': 'start server',
  'stop': 'shutdown server',
  'restart': 'restart server',
  'info': 'output server info',
  'open': 'open document root directory',
  'clean': 'clean files in document root'
};

exports.options = {
  '-h, --help': 'print this help message',
  '-p, --port <int>': 'server listen port',
  '--root <path>': 'document root',
  '--timeout <seconds>': 'start timeout',
  '--https': 'start https server',
  '--no-browse': 'do not open a web browser.',
  '--no-daemon': 'do not run in background.',
  '--include <glob>': 'clean include filter',
  '--exclude <glob>': 'clean exclude filter'
};

// 启动
exports.run = function(argv, cli, env) {
  // 显示帮助信息
  if (argv.h || argv.help) {
    return cli.help(exports.name, exports.options, exports.commands);
  }

  // 校验参数正确性
  if (!validate(argv)) {
    return;
  }

  // server port
  if (argv.p && !argv.port) {
    argv.port = argv.p;
    delete argv.p;
  }

  // 启动服务
  var cmd = argv._[1];
  delete argv['_'];

  var serverInfo = util.serverInfo() || {};
  var projectConfig = util.getProjectConfig();

  var options = _.assign({
    type: 'node',
    // 每次 start 的时候，root 都需要重新指定，否则使用默认 document root.
    root: cmd === 'start' ? util.getDefaultServerRoot() : (serverInfo.root || util.getDefaultServerRoot()),
    port: 8080,
    timeout: 30, // 30 秒
    browse: true,
    daemon: true,
    https: false,
    proxy: null
  }, projectConfig, argv);

  // 如果指定的是文件，则报错。
  if (_.exists(options.root)) {
    if (!_.isDir(options.root)) {
      fis.log.error('invalid document root `%s` is not a directory.', options.root);
    }
  } else {
    _.mkdir(options.root);
  }

  options.root = _.realpath(options.root);

  // set options to test server.
  test.options(options);

  switch (cmd) {
    case 'restart':
      test.stop(test.start.bind(test));
      break;

    case 'start':
    case 'stop':
    case 'info':
    case 'open':
    case 'clean':
      test[cmd].call(test);
      break;

    default:
      cli.help(exports.name, exports.options, exports.commands);
      break;
  }
};

// 验证参数是否正确。
function validate() {
  return true;
}
