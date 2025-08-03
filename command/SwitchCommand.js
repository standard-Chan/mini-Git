import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import GitPaths from '../GitPaths.js';

export default class SwitchCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPaths = GitPaths.of(rootPath);
  }

  moveHeadTo(branchName) {
    const branchPath = path.join(this.gitPaths.refsHeadsPath, branchName);

    // 브랜치 존재 확인
    if (!fs.existsSync(branchPath)) {
      console.error(
        chalk.red(`브랜치 '${chalk.cyanBright(branchName)}'가 존재하지 않습니다.\n`)
      );
      return;
    }

    // HEAD 갱신
    const newHeadContent = `ref: refs/heads/${branchName}\n`;
    fs.writeFileSync(this.gitPaths.headPath, newHeadContent);

    console.log(
      `${chalk.green('switch')}: HEAD가 '${chalk.cyanBright(branchName)}' 브랜치를 가리키도록 변경되었습니다.\n`
    );
  }
}