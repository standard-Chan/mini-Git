import fs from 'fs';
import path from 'path';

export default class InitCommand {
  static INITIAL_BRANCH_NAME = 'master';

  constructor() {}

  static initDirectories(rootPath) {
    const gitPath = path.join(rootPath, ".git");
    const objectsPath = path.join(this.gitPath, "objects");
    const refsPath = path.join(this.gitPath, "refs", "heads");

    // 디렉토리 생성
    fs.mkdirSync(gitPath, { recursive: true });
    fs.mkdirSync(objectsPath, { recursive: true });
    fs.mkdirSync(refsPath, { recursive: true });
  }

  /** HEAD 파일 생성 */
  static initHeadFile(headPath) {
    fs.writeFileSync(headPath, `ref: refs/heads/${InitCommand.INITIAL_BRANCH_NAME}\n`);
  }

  /** refs/heads의 branch 파일 생성 */
  static initBranchFile(refsHeadsPath) {
    mkdirSync(refsHeadsPath, { recursive: true});
    
    const path = path.join(refsHeadsPath, InitCommand.INITIAL_BRANCH_NAME);
    fs.writeFileSync(path, '');
  }

  /** index 파일 생성 */
  static initIndexFile(indexPath) {
    fs.writeFileSync(indexPath, '');
  }
}