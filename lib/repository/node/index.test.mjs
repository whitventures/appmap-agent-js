import { strict as Assert } from "assert";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { buildTestAsync } from "../../../build/index.mjs";
import Repository from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const { url } = import.meta;

const testAsync = async () => {
  const { extractRepositoryPackage, extractRepositoryDependency } = Repository(
    await buildTestAsync(import.meta),
  );
  let path = fileURLToPath(url);
  while (!path.endsWith("appmap-agent-js")) {
    path = dirname(path);
  }
  assertDeepEqual(extractRepositoryPackage(`${path}/lib`), {
    name: null,
    version: null,
    homepage: null,
  });
  {
    const { name, version, homepage } = extractRepositoryPackage(path);
    assertEqual(name, "@appland/appmap-agent-js");
    assertEqual(
      homepage,
      "https://github.com/applandinc/appmap-agent-js.git/#readme",
    );
    assertEqual(typeof version, "string");
  }
  {
    const {
      directory,
      package: { name, version },
    } = extractRepositoryDependency(path, "acorn");
    assertEqual(name, "acorn");
    assertEqual(typeof directory, "string");
    assertEqual(typeof version, "string");
  }
};

testAsync();
