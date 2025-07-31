import GitUtil from "./GitUtil.js";
import Repository from "./Repository.js";

new GitUtil('temp');
const repo = new Repository('temp');
repo.init();

repo.branch();
repo.branch('새로운 브랜치!');
repo.branch();
repo.switch('master');
repo.add('test.txt');
repo.add('a/b/test.txt');
repo.add('a/c/test.txt');

repo.status();
repo.commit('');
repo.status();