import fs from 'fs';
import path from 'path';
import GitPaths from '../GitPaths.js';

export default class InitCommand {
  static INITIAL_BRANCH_NAME = 'master';

  constructor() {}

  static initDirectories(rootPath) {
    
    this.gitPaths = GitPaths.of(rootPath);

    // 디렉토리 생성
    fs.mkdirSync(this.gitPaths.gitPath, { recursive: true });
    fs.mkdirSync(this.gitPaths.objectsPath, { recursive: true });
    fs.mkdirSync(this.gitPaths.refsPath, { recursive: true });
  }

  /** HEAD 파일 생성 */
  static initHeadFile(headPath) {
    fs.writeFileSync(headPath, `ref: refs/heads/${InitCommand.INITIAL_BRANCH_NAME}\n`);
    console.log(`HEAD 파일 생성 완료`);
  }

  /** refs/heads의 branch 파일 생성 */
  static initBranchFile(refsHeadsPath) {
    fs.mkdirSync(refsHeadsPath, { recursive: true});

    const branchPath = path.join(refsHeadsPath, InitCommand.INITIAL_BRANCH_NAME);
    fs.writeFileSync(branchPath, '');
    console.log(`refs/heads/${InitCommand.INITIAL_BRANCH_NAME} 파일 생성 완료`);
  }

  /** index 파일 생성 */
  static initIndexFile(indexPath) {
    fs.writeFileSync(indexPath, '');
    console.log(`index 파일 생성 완료`);
  }
}