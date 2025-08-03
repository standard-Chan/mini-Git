import GitPaths from "./GitPaths.js";
import GitUtil from "./GitUtil.js";
import GitCLI from './GitCLI.js';

const ROOT_PATH = '.';

new GitUtil(ROOT_PATH);
new GitPaths(ROOT_PATH);
// Git CLI 시작
const cli = new GitCLI(ROOT_PATH);
cli.start();
