import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import GitUtil from '../GitUtil.js';

export default class BranchCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, '.git');
    this.refsHeadsPath = path.join(this.gitPath, 'refs', 'heads');
    this.gitUtil = GitUtil.getInstance();
  }

  /** 현재 브랜치 목록을 출력 */
  printBranchList() {
    const currentBranch = this.gitUtil.getCurrentBranch();
    try {
      const branches = fs.readdirSync(this.refsHeadsPath);

      console.log(chalk.bold('브랜치 목록'));
      branches.forEach(branch => {
        if (branch == currentBranch) console.log(` ${chalk.greenBright('➤')} ${chalk.greenBright(branch)} (current)`);
        else console.log(` ${chalk.cyanBright('➤')} ${chalk.cyan(branch)}`);
      });
      console.log();
    } catch (err) {
      console.error(chalk.red(`브랜치 목록을 불러오는 중 오류 발생: ${err.message}`));
    }
  }

  /** refs/heads에 브랜치 파일 생성 */
  createBranch(name, commitHash) {
    const newBranchPath = path.join(this.refsHeadsPath, name);
    const branchDir = path.dirname(newBranchPath);

    try {
      // 브랜치 디렉토리가 존재하지 않으면 생성
      if (!fs.existsSync(branchDir)) {
        fs.mkdirSync(branchDir, { recursive: true });
      }

      fs.writeFileSync(newBranchPath, commitHash + '\n');

      console.log(
        chalk.green('✓ ') +
        `${chalk.cyanBright(name)} 브랜치를 생성하였습니다. `
      );
    } catch (err) {
      console.error(chalk.red(`브랜치 생성 실패: ${err.message}`));
    }
  }
}
