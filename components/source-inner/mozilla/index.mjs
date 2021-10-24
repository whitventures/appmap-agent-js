import { SourceMapConsumer } from "source-map";

export default (dependencies) => {
  return {
    compileSourceMap: (payload) => new SourceMapConsumer(payload),
    mapSource: (mapping, line1, column1) => {
      const {
        source: url2,
        line: line2,
        column: column2,
      } = mapping.originalPositionFor({ line: line1, column: column1 });
      if (url2 === null || line2 === null || column2 === null) {
        return null;
      }
      return {
        url: url2,
        line: line2,
        column: column2,
      };
    },
  };
};
