
import Crawler from './libs/crawler';
import Analyzer from './libs/analyzer';

const cwd = process.cwd();
const crawler = new Crawler('./examples/fn/01');
const astStream = crawler.getObeservable();
const analyzer = new Analyzer(astStream);

crawler.start();

