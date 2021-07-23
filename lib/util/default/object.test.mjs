import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Object from "./object.mjs";

const { equal: assertEqual, fail: assertFail } = Assert;

const mainAsync = async () => {
  const { hasOwnProperty, coalesce, mapMaybe } = await Object(
    await buildAsync({}),
  );

  // mapMaybe //

  assertEqual(
    mapMaybe(null, () => assertFail()),
    null,
  );

  assertEqual(
    mapMaybe("foo", (x) => x + x),
    "foofoo",
  );

  // hasOwnProperty //

  assertEqual(hasOwnProperty({ foo: "bar" }, "foo"), true);

  assertEqual(hasOwnProperty({ __proto__: { foo: "bar" } }, "foo"), false);

  // coalesce //

  assertEqual(coalesce({ foo: "bar" }, "foo", "qux"), "bar");

  assertEqual(coalesce(null, "foo", "qux"), "qux");
};

mainAsync();
