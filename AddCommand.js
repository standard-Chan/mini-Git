import path from 'path';
import fs from 'fs';

export default class AddCommand {
    constructor(rootPath) {
      this.rootPath = rootPath;
      this.gitPath = path.join(rootPath, ".git");
  
      this.objectsPath = path.join(this.gitPath, "objects");
      this.headPath = path.join(this.gitPath, "HEAD");
      this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
      this.indexPath = path.join(this.gitPath, "index");
    }

    /** */
}