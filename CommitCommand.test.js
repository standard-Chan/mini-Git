import CommitCommand from "./CommitCommand.js";
import GitUtil from "./GitUtil.js";

new GitUtil('temp');
const commit = new CommitCommand('temp');

// const indexEntries = commit.readIndex();

// console.log(indexEntries);


// const tree = commit.convertEntriesToTree(indexEntries);
// console.log(tree.a.b['test.txt']);

// commit.buildTree(tree);
