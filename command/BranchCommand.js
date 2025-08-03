import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import GitUtil from '../GitUtil.js';
import GitPaths from '../GitPaths.js';

export default class BranchCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPaths = GitPaths.of(rootPath);
    this.gitUtil = GitUtil.getInstance();
  }

  /** 현재 브랜치 목록을 출력 */
  printBranchList() {
    const currentBranch = this.gitUtil.getCurrentBranch();
    try {
      const branches = fs.readdirSync(this.gitPaths.refsHeadsPath);

      console.log(chalk.bold('브랜치 목록'));
      branches.forEach(branch => {
        if (branch == currentBranch) console.log(` ${chalk.greenBright('➤')} ${chalk.greenBright(branch)} (current)`);
        else console.log(` ${chalk.cyanBright('➤')} ${chalk.cyan(branch)}`);
      });
      console.log();
    } catch (err) {
      console.error(chalk.red(`[ERROR] 브랜치가 존재하지 않습니다.`));
    }
  }

  /** refs/heads에 브랜치 파일 생성 */
  createBranch(name, commitHash) {
    const newBranchPath = path.join(this.gitPaths.refsHeadsPath, name);
    const branchDir = path.dirname(newBranchPath);

    try {
      // 브랜치 디렉토리가 존재하지 않으면 생성
      if (!fs.existsSync(branchDir)) {
        fs.mkdirSync(branchDir, { recursive: true });
      }

      fs.writeFileSync(newBranchPath, commitHash + '\n');

      console.log(
        chalk.green(' -') +
        `${chalk.cyanBright(name)} ${chalk.green('브랜치를 생성하였습니다.')}`
      );
    } catch (err) {
      console.error(chalk.red(`[ERROR] 브랜치 생성이 실패: ${err.message}`));
    }
  }
}