import Repository from "./Repository.js";


const repo = new Repository('temp');
repo.init();

repo.branch();
repo.branch('new2');
repo.branch();