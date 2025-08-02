import path from 'path';

export default class GitPaths {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");

    this.objectsPath = path.join(this.gitPath, "objects");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
    this.indexPath = path.join(this.gitPath, "index");
    this.refsPath = path.join(this.gitPath, "refs", "heads");
  }

  static #cache = new Map();

  static of(path) {
    if (!this.#cache.has(path)) {
      this.#cache.set(path, new GitPaths(path));
    }
    return this.#cache.get(path);
  }
}