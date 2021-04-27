import * as ChildProcess from 'child_process';
import logger from './logger.mjs';
import { validateOptions } from './validate.mjs';
import * as Agent from './index.mjs';

// const forwardTapNodeArg = (argv) =>
//   `--node-arg='${argv.replace(/'/gu, "\\'")}'`;

const methods = {
  spawn: ({ execArgv, env }, [command, ...argv]) =>
    ChildProcess.spawn(command, [...execArgv, ...argv], {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env,
      },
    }),
};

export default (method, options, command, callback) => {
  if (!(method in methods)) {
    return callback(new Error('Invalid method'));
  }
  try {
    validateOptions(options);
  } catch (error) {
    return callback(error);
  }
  if (command.length === 0) {
    return callback(new Error('Empty command'));
  }
  method = methods[method];
  options = {
    protocol: 'messaging',
    host: 'localhost',
    port: 0,
    'hook-esm': true,
    'hook-cjs': true,
    'hook-child-process': false,
    'rc-file': null,
    ...options,
  };
  if (options.protocol === 'inline') {
    if (options.port !== 0) {
      logger.warning(
        `argument --port has not effect when --protocol=inline, got: %j`,
        options.port,
      );
      options.port = 0;
    }
    return callback(null, null, method(Agent.compileOptions(options), command));
  }
  const server = Agent.createServer(options.protocol, options['rc-file'], null);
  options['rc-file'] = null;
  /* c8 ignore start */
  server.on('error', (error) => {
    callback(error);
    callback = null;
  });
  /* c8 ignore stop */
  server.on('listening', () => {
    server.removeAllListeners('error');
    options.port = server.address().port;
    const client = method(Agent.compileOptions(options), command);
    client.on('exit', (code, signal) => {
      server.close();
    });
    callback(null, server, client);
  });
  server.listen(options.port);
  return null;
};
