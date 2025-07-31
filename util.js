import path from 'path';

function getGitPaths(rootPath) {
  const gitPath = path.join(rootPath, ".git");

  return {
    rootPath,
    gitPath,
    objectsPath: path.join(gitPath, "objects"),
    headPath: path.join(gitPath, "HEAD"),
    refsHeadsPath: path.join(gitPath, "refs", "heads"),
    indexPath: path.join(gitPath, "index"),
  };
}
