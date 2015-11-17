import path from 'path';
import Font from 'cfonts';
import prettyjson from 'prettyjson';
import yargs from 'yargs';
import {writeFile} from './utilities';
import {scan} from './HubScanner';

let argv = yargs
  .usage('Usage: $0 <command> <assembly> [options]')
  .command('scan', 'scans the specified .NET assembly and prints the results to the console')
  .command('json', 'generate a JSON file that describes the specified .NET assembly')
  .command('code', 'generate a javascript source code file that describes the specified .NET assembly', y =>
    y.option('t', {
      alias: 'template',
      demand: true,
      default: 'redux',
      describe: 'the template to use to generate the source code files',
      type: 'string'
    }))
  .demand(2, 'Missing required argument(s). Specify a command to execute (scan, json, code) followed by the assembly to scan (/path/to/compiled/assembly).')
  .option('f', {
    alias: 'output-file',
    demand: false,
    describe: 'Specify a file to stream the output. ',
    type: 'string'
  })
  .option('d', {
    alias: 'output-dir',
    demand: false,
    describe: 'Specify directory to stream the output. Separate files will be created/updated for each proxy generated. ',
    type: 'string'
  })
  .option('h', {
    alias: 'hub-client-url',
    demand: false,
    describe: 'Also generate a hub client with the given url.',
    type: 'string',
    group: 'Me Code Generation Options: '
  })
  .implies('h', 'd')
  .option('p', {
    alias: 'path-to-hub-client',
    demand: false,
    default: './Client',
    describe: 'The relative path to the hub client module',
    type: 'string',
    group: 'Me Code Generation Options: '
  })
  .option('c', {
    alias: 'hub-client-var',
    demand: false,
    default: '$0',
    describe: 'The name of the exported mumbo jumbo',
    type: 'string',
    group: 'Me Code Generation Options: '
  })
  .help('help')
  .epilog('For more information, go to https://github.com/RoviSys/signal-arr')
  .locale('pirate')
  .wrap(yargs.terminalWidth())
  .argv;

//console.dir(argv);

const command = argv._[0];
const assembly = argv._[1];


let promise = scan(assembly);
switch(command) {
  case 'scan':
    promise = promise
      .then(result => argv.f ? prettyjson.render(result) : result.map(x => Object.assign(x, { r: prettyjson.render(x)})));
    break;
  case 'json':
    promise = promise
      .then(result => argv.f ? JSON.stringify(result, null, 2) : result.map(x => Object.assign(x, { r: JSON.stringify(x, null, 2)})));
    break;
  case 'code':
    let options = {
      clientVar: argv.c,
      pathToClient: argv.p
    };
    switch(argv.t) {
      case 'redux-classic':
        const reduxClassic = require('./ReduxClassicTemplate');
        promise = promise
          .then(result => {
            let templatized = result.map(x => Object.assign(x, { r: reduxClassic(x, options)}));
            return argv.f
              ? templatized.map(y => y.r).join('\r\n')
              : templatized;
          });
        break;
      case 'redux':
        const redux = require('./ReduxTemplate');
        promise = promise
          .then(result => {
            let templatized = result.map(x => Object.assign(x, { r: redux(x, options)}));
            return argv.f
              ? templatized.map(y => y.r).join('\r\n')
              : templatized;
          });
        break;
    }
    break;
}

if(argv.f || argv.d) {
  var fonts = new Font({
    'text': 'signal-arr', //text to be converted
    'font': 'block', //define the font face
    'colors': '', //define all colors
    'background': 'Black', //define the background color
    'letterSpacing': 1, //define letter spacing
    'space': true, //define if the output text should have empty lines on top and on the bottom
    'maxLength': '10' //define how many character can be on one line
  });
}
if(argv.h) {

}

if(argv.f) {
  promise = promise
    .then(result => writeFile(command, path.normalize(argv.f), result));
} else if(argv.d) {
  const ext =command === 'json' ? '.json' : '.js';
  promise = promise
    .then(results => Promise.all(results.map(x => writeFile(command, argv.d + x.Name + ext, x.r))));
} else {
  promise = promise
    .then(results => {
      results.forEach(x => x.r.split('\r\n').forEach(y => console.log(y)));
      return results;
    });
}

promise
  .catch(console.error);
