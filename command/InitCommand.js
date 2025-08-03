import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import GitPaths from '../GitPaths.js';

export default class InitCommand {
  static INITIAL_BRANCH_NAME = 'master';

  constructor() {}

  static initDirectories(rootPath) {
    this.gitPaths = GitPaths.of(rootPath);

    fs.mkdirSync(this.gitPaths.gitPath, { recursive: true });
    fs.mkdirSync(this.gitPaths.objectsPath, { recursive: true });
    fs.mkdirSync(this.gitPaths.refsPath, { recursive: true });

    console.log(chalk.green(' .git 디렉토리 구조 생성 완료'));
    console.log(chalk.gray(`  - ${chalk.cyanBright(this.gitPaths.gitPath)}`));
    console.log(chalk.gray(`  - ${chalk.cyanBright(this.gitPaths.objectsPath)}`));
    console.log(chalk.gray(`  - ${chalk.cyanBright(this.gitPaths.refsPath)}`));
  }

  /** HEAD 파일 생성 */
  static initHeadFile(headPath) {
    fs.writeFileSync(headPath, `ref: refs/heads/${InitCommand.INITIAL_BRANCH_NAME}\n`);
    console.log(
      `${chalk.green(' HEAD 파일 생성 완료')} (${chalk.cyanBright('ref: refs/heads/master')})`
    );
  }

  /** refs/heads의 branch 파일 생성 */
  static initBranchFile(refsHeadsPath) {
    fs.mkdirSync(refsHeadsPath, { recursive: true });

    const branchPath = path.join(refsHeadsPath, InitCommand.INITIAL_BRANCH_NAME);
    fs.writeFileSync(branchPath, '');
    console.log(
      `${chalk.green(' 브랜치 초기화 완료')} (${chalk.cyanBright(`refs/heads/${InitCommand.INITIAL_BRANCH_NAME}`)})`
    );
  }

  /** index 파일 생성 */
  static initIndexFile(indexPath) {
    fs.writeFileSync(indexPath, '');
    console.log(`${chalk.green(' index 파일 생성 완료')} (${chalk.cyanBright(indexPath)})`);
  }
}
