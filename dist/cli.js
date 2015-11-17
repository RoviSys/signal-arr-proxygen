'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cfonts = require('cfonts');

var _cfonts2 = _interopRequireDefault(_cfonts);

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _utilities = require('./utilities');

var _HubScanner = require('./HubScanner');

var argv = _yargs2['default'].usage('Usage: $0 <command> <assembly> [options]').command('scan', 'scans the specified .NET assembly and prints the results to the console').command('json', 'generate a JSON file that describes the specified .NET assembly').command('code', 'generate a javascript source code file that describes the specified .NET assembly', function (y) {
  return y.option('t', {
    alias: 'template',
    demand: true,
    'default': 'redux',
    describe: 'the template to use to generate the source code files',
    type: 'string'
  });
}).demand(2, 'Missing required argument(s). Specify a command to execute (scan, json, code) followed by the assembly to scan (/path/to/compiled/assembly).').option('f', {
  alias: 'output-file',
  demand: false,
  describe: 'Specify a file to stream the output. ',
  type: 'string'
}).option('d', {
  alias: 'output-dir',
  demand: false,
  describe: 'Specify directory to stream the output. Separate files will be created/updated for each proxy generated. ',
  type: 'string'
}).option('h', {
  alias: 'hub-client-url',
  demand: false,
  describe: 'Also generate a hub client with the given url.',
  type: 'string',
  group: 'Me Code Generation Options: '
}).implies('h', 'd').option('p', {
  alias: 'path-to-hub-client',
  demand: false,
  'default': './Client',
  describe: 'The relative path to the hub client module',
  type: 'string',
  group: 'Me Code Generation Options: '
}).option('c', {
  alias: 'hub-client-var',
  demand: false,
  'default': '$0',
  describe: 'The name of the exported mumbo jumbo',
  type: 'string',
  group: 'Me Code Generation Options: '
}).help('help').epilog('For more information, go to https://github.com/RoviSys/signal-arr').locale('pirate').wrap(_yargs2['default'].terminalWidth()).argv;

//console.dir(argv);

var command = argv._[0];
var assembly = argv._[1];

var promise = (0, _HubScanner.scan)(assembly);
switch (command) {
  case 'scan':
    promise = promise.then(function (result) {
      return argv.f ? _prettyjson2['default'].render(result) : result.map(function (x) {
        return Object.assign(x, { r: _prettyjson2['default'].render(x) });
      });
    });
    break;
  case 'json':
    promise = promise.then(function (result) {
      return argv.f ? JSON.stringify(result, null, 2) : result.map(function (x) {
        return Object.assign(x, { r: JSON.stringify(x, null, 2) });
      });
    });
    break;
  case 'code':
    var options = {
      clientVar: argv.c,
      pathToClient: argv.p
    };
    switch (argv.t) {
      case 'redux-classic':
        var reduxClassic = require('./ReduxClassicTemplate');
        promise = promise.then(function (result) {
          var templatized = result.map(function (x) {
            return Object.assign(x, { r: reduxClassic(x, options) });
          });
          return argv.f ? templatized.map(function (y) {
            return y.r;
          }).join('\r\n') : templatized;
        });
        break;
      case 'redux':
        var redux = require('./ReduxTemplate');
        promise = promise.then(function (result) {
          var templatized = result.map(function (x) {
            return Object.assign(x, { r: redux(x, options) });
          });
          return argv.f ? templatized.map(function (y) {
            return y.r;
          }).join('\r\n') : templatized;
        });
        break;
    }
    break;
}

if (argv.f || argv.d) {
  var fonts = new _cfonts2['default']({
    'text': 'signal-arr', //text to be converted
    'font': 'block', //define the font face
    'colors': '', //define all colors
    'background': 'Black', //define the background color
    'letterSpacing': 1, //define letter spacing
    'space': true, //define if the output text should have empty lines on top and on the bottom
    'maxLength': '10' //define how many character can be on one line
  });
}
if (argv.h) {}

if (argv.f) {
  promise = promise.then(function (result) {
    return (0, _utilities.writeFile)(command, _path2['default'].normalize(argv.f), result);
  });
} else if (argv.d) {
  (function () {
    var ext = command === 'json' ? '.json' : '.js';
    promise = promise.then(function (results) {
      return Promise.all(results.map(function (x) {
        return (0, _utilities.writeFile)(command, argv.d + x.Name + ext, x.r);
      }));
    });
  })();
} else {
  promise = promise.then(function (results) {
    results.forEach(function (x) {
      return x.r.split('\r\n').forEach(function (y) {
        return console.log(y);
      });
    });
    return results;
  });
}

promise['catch'](console.error);
//# sourceMappingURL=cli.js.map