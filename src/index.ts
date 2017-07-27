
import Crawler from './crawler';
import Scanner from './scanner';
import Evaluator from './evaluator';

const cwd = process.cwd();
const crawler = new Crawler('./examples/fn/03');
const evaluator = new Evaluator(crawler);

const evaluatedASTStream = evaluator.getEvaluatedASTStream();

evaluatedASTStream.subscribe(ast => {
    console.log(ast);
});

evaluator.start();

