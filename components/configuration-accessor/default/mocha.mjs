import { coalesce } from "../../util/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { escapeShell, escapeNodeOption } from "./escape.mjs";
import {
  sniffSource,
  sniffTokens,
  parseSource,
  splitTokens,
} from "./package.mjs";

export const name = "mocha";
export const recursive = null;

export const doesSupportSource = (source, shell) =>
  sniffSource(source, "mocha", shell);

export const doesSupportTokens = (tokens) => sniffTokens(tokens, "mocha");

export const hookCommandSourceAsync = (source, shell, base) => {
  const groups = parseSource(source);
  return [
    `${groups.exec} --require ${escapeShell(
      shell,
      convertFileUrlToPath(toAbsoluteUrl("lib/node/mocha-hook.mjs", base)),
    )} ${groups.argv}`,
  ];
};

export const hookCommandTokensAsync = (tokens, base) => {
  const { exec, argv } = splitTokens(tokens);
  return [
    ...exec,
    "--require",
    convertFileUrlToPath(toAbsoluteUrl("lib/node/mocha-hook.mjs", base)),
    ...argv,
  ];
};

export const hookEnvironment = (env, base) => ({
  ...env,
  NODE_OPTIONS: `${coalesce(
    env,
    "NODE_OPTIONS",
    "",
  )} --experimental-loader=${escapeNodeOption(
    toAbsoluteUrl("lib/node/recorder.mjs", base),
  )}`,
});
