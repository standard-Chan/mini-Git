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

    add() {
      
    }

    /** blob 파일 저정하기 */
    saveBlob() {

    }

    /** index 파일에 맵핑 정보 저장하기 */
    saveToIndex() {

    }

    /** 압축하기 */
    compress() {
      const header = `blob ${content.length}\0`;
    }
}