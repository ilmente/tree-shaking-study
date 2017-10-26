import registerUtils from './jscodeshift-utils';

registerUtils();

import Crawler from './crawler';
import Scanner from './scanner';
import Evaluator from './evaluator';

const cwd = process.cwd();
const crawler = new Crawler('./examples/fn/01');
const evaluator = new Evaluator(crawler);

const evaluatedASTStream = evaluator.getEvaluatedASTStream();

evaluatedASTStream.subscribe(ast => {
    // console.log(ast.map);
});

evaluator.start();

