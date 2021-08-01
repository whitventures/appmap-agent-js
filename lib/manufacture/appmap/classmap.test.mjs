import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Classmap from "./classmap.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { createClassmap, addClassmapFile, compileClassmap, getClassmapInfo } =
    Classmap(dependencies);

  const default_conf = {
    pruning: false,
    language: { version: 2020 },
    "function-name-placeholder": "$",
  };

  const setup = (cwd, conf, files) => {
    const classmap = createClassmap(
      extendConfiguration(createConfiguration(cwd), conf, cwd),
    );
    for (const file of files) {
      addClassmapFile(classmap, file);
    }
    return classmap;
  };

  const test = (cwd, conf, files, slice = new Set()) =>
    compileClassmap(setup(cwd, conf, files), slice);

  // populate //

  assertDeepEqual(
    test("/cwd", default_conf, [
      {
        index: 0,
        exclude: [],
        type: "script",
        path: "/cwd/foo/bar",
        code: "123;",
      },
      {
        index: 1,
        exclude: [],
        type: "script",
        path: "/cwd/foo/bar/qux",
        code: "123;",
      },
    ]),
    [
      {
        type: "package",
        name: "foo",
        children: [
          {
            type: "class",
            name: "bar",
            children: [],
          },
          {
            type: "package",
            name: "bar",
            children: [
              {
                type: "class",
                name: "qux",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  );

  // object //

  const testClass = (snippet, route) => {
    assertDeepEqual(
      test("/cwd", default_conf, [
        {
          index: 123,
          exclude: [],
          type: "script",
          path: "/cwd/filename.js",
          code: `x = ${snippet};`,
        },
      ]),
      [
        {
          type: "class",
          name: "filename.js",
          children: [
            {
              type: "class",
              name: "x",
              children: [
                {
                  type: "class",
                  name: "$",
                  bound: true,
                  children: [
                    {
                      type: "function",
                      name: "k",
                      location: "filename.js:1",
                      static: false,
                      labels: [],
                      comment: null,
                      source: null,
                      route,
                    },
                  ],
                },
              ],
              bound: false,
            },
          ],
        },
      ],
    );
  };

  testClass(
    "{k: function () {} }",
    "123/body/0/expression/right/properties/0/value",
  );
  testClass(
    "class { k () {} }",
    "123/body/0/expression/right/body/body/0/value",
  );
  testClass(
    "class extends Object { k () {} }",
    "123/body/0/expression/right/body/body/0/value",
  );

  // exclude //

  assertDeepEqual(
    test("/cwd", default_conf, [
      {
        index: 0,
        exclude: ["f"],
        type: "script",
        path: "/cwd/filename.js",
        code: "function f () {}",
      },
    ]),
    [
      {
        type: "class",
        name: "filename.js",
        children: [],
      },
    ],
  );

  // pruning //

  assertDeepEqual(
    test(
      "/cwd",
      { ...default_conf, pruning: true },
      [
        {
          index: 123,
          exclude: [],
          type: "script",
          path: "/cwd/filename.js",
          code: "o1 = {k1 () {}}; o2 = {k2 () {} }",
        },
      ],
      new Set(["123/body/0/expression/right/properties/0/value"]),
    ),
    [
      {
        type: "class",
        name: "filename.js",
        children: [
          {
            type: "class",
            name: "o1",
            children: [
              {
                type: "class",
                name: "$",
                bound: true,
                children: [
                  {
                    type: "function",
                    name: "k1",
                    location: "filename.js:1",
                    static: false,
                    labels: [],
                    comment: null,
                    source: null,
                    route: "123/body/0/expression/right/properties/0/value",
                  },
                ],
              },
            ],
            bound: false,
          },
        ],
      },
    ],
  );

  // getClassmapLink //

  assertDeepEqual(
    getClassmapInfo(
      setup("/cwd", default_conf, [
        {
          index: 123,
          exclude: [],
          type: "script",
          path: "/cwd/filename.js",
          code: "function f (x, ... xs) {}",
        },
      ]),
      "123/body/0",
    ),
    {
      link: {
        defined_class: "$",
        method_id: "f",
        path: "filename.js",
        lineno: 1,
        static: false,
      },
      parameters: ["x", "...xs"],
    },
  );
};

testAsync();
