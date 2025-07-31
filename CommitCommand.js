import path from 'path';
import fs from 'fs';
import GitUtil from './GitUtil.js';
import { FILE_MODE } from './constants.js';

export default class Commit {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");

    this.objectsPath = path.join(this.gitPath, "objects");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
    this.indexPath = path.join(this.gitPath, "index");

    this.gitUtil = GitUtil.getInstance();
  }

  commit() {

  }

  /** Tree 객체 생성 */
  createTree() {
    const indexEntries = this.readIndex();
    const DirEntires = this.convertToDirEntries(indexEntries);
    const TreeObjects = writeTreeContent(treeEntry);

    // 
  }

  /** index 파일을 읽고 파싱한다. [{fileMode, hash, filePath}, ... ]*/
  readIndex() {
    let indexEntries = []; // [{ fileMode, hash, filePath }, ...]
    const indexLines = this.gitUtil.readFile(this.indexPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);

    indexLines.forEach(line => {
      const [fileMode, hash, filePath] = line.trim().split(' ');
      indexEntries.push({ fileMode, hash, filePath });
    });

    return indexEntries;
  }

  convertToDirEntries(indexEntries) {
  }

  writeTreeContent() {
  }

  /** Tree 객체 압축 */
  compressTree() { }

  /** Tree 객체 저장 */
  saveTree() { }


}