#!/usr/bin/env node

import minimist from 'minimist';
import { main } from '../lib/server/main.mjs';

main(process, minimist(process.argv)).then((either) => {
  either.either(
    (message) => {
      process.stderr.write(message);
      process.stderr.write('\n');
    },
    (code) => {
      process.exitCode = code;
    },
  );
});
