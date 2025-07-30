import fs from 'fs';
import path from 'path';

export default class branchCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
  }

  /** 현재 브랜치 목록을 출력 */
  printBranchList() {
    const branches = fs.readdirSync(this.refsHeadsPath);

    console.log('브랜치 목록:');
    branches.forEach(branch => {console.log(`- ${branch}`);});
    console.log();
  }

  /** refs/heads에 브랜치 파일 생성 */
  createBranch(name, commitHash) {
    const newBranchPath = path.join(this.refsHeadsPath, name);
    fs.writeFileSync(newBranchPath, commitHash + '\n');
  }
}