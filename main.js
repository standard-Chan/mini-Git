import GitPaths from "./GitPaths.js";
import GitUtil from "./GitUtil.js";


import GitCLI from './GitCLI.js';

const ROOT_PATH = 'gitTest';

new GitUtil(ROOT_PATH);
new GitPaths(ROOT_PATH);
// Git CLI 시작
const cli = new GitCLI(ROOT_PATH);
cli.start();


// const repo = new Repository('temp');
// repo.init();

// repo.branch();
// repo.branch('master-test');
// repo.switch('master-test');
// repo.add('a/b/test.txt');
// repo.add('a/c/test.txt');

// repo.commit('test파일 2개 추가', '네부캠', 'nabocamp@naver.com');
// repo.status();

// repo.add('test.txt');
// repo.commit('테스트 메시지', '네부캠', 'nabocamp@naver.com');
// repo.log();