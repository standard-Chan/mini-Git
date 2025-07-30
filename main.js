import GitUtil from "./GitUtil.js";
import Repository from "./Repository.js";

new GitUtil('temp');
const repo = new Repository('temp');
repo.init();

repo.branch();
repo.branch('new2');
repo.branch();
repo.switch('master');
repo.add('test.txt');

repo.status();