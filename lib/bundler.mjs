
import * as Path from "path";
import * as Fs from "fs";
import * as Url from "url";

const dirname = Path.dirname(new Url.URL(import.meta.url).pathname);

const normalize = {
  __proto__: null,
  "1": "1",
  "2": "2",
  "3": "3",
  "5": "5",
  "5.1": "5.1",
  "6": "2015",
  "7": "2016",
  "8": "2017",
  "9": "2018",
  "10": "2019",
  "11": "2020",
  "2015": "2015",
  "2016": "2016",
  "2017": "2017",
  "2018": "2018",
  "2019": "2019",
  "2020": "2020",
};

const support = {
  __proto__: null,
  "5.1": "es5-1",
  "2015": "es2015",
  "2016": "es2015",
  "2017": "es2015",
  "2018": "es2015",
  "2019": "es2015",
  "2020": "es2015",
};

export const bundle (namespace, options) => {
  options = {ecma:"2015", channel:"local", platform:"node", ..options};
  if (!(options.ecma in normalize)) {
    logger.warning(`Invalid ecma version, got: ${options.ecma}`);
    options.ecma = "2015";
  } else {
    options.ecma = normalize[options.ecma];
  }
  let basename;
  if (!(options.ecma in support)) {
    logger.warning(`Unsupported ecma version, got ${options.ecma}`);
    basename = "es2015";
  } else {
    basename = support[options.ecma];
  }
  basename = Path.join(__dirname, "..", "src", basename);
  return [
    Path.join(platform, "send", `${channel}.js`),
    Path.join(platform, "setup-engine.js"),
    Path.join(platform, "setup-archive.js"),
    "empty-marker.js",
    "event-counter.js",
    "get-identity.js",
    "get-now.js",
    "serialize.js"
  ].map((relative) => Fs.readFileSync(Path.join(basename, relative), "utf8")).join("").replace(/APPMAP_[A-Z_]*/g, (identifier) => namespace.compileGlobalIdentifier(identifier));
};
