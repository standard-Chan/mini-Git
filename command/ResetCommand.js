import GitPaths from "../GitPaths.js";
import GitUtil from "../GitUtil";

export default class ResetCommand {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPaths = GitPaths.of(rootPath);
    this.gitUtil = GitUtil.getInstance();
  }

  /** reset --soft  */
  resetSoft(commitHash) {
    this.changeToPointTo(commitHash);
  }

  /** reset --mixed */
  resetMixed(commitHash) {
    this.changeToPointTo(commitHash);
    this.clearIndex();
  }

  /** reset --hard */
  resetHard(commitHash) {
    this.changeToPointTo(commitHash);
    this.restoreFiles();
    this.clearIndex();
  }

  /** HEAD 를 commitHash로 변경 */
  changeToPointTo(commitHash) {
    const curBranch = this.gitUtil.getCurrentBranch();

    if (curBranch) {
      const branchRefPath = path.join(this.gitPaths.refsHeadsPath, curBranch);
      // 브랜치 파일 내용을 커밋 해시로 덮어쓰기
      fs.writeFileSync(branchRefPath, `${commitHash}\n`);
      console.log(chalk.green(`브랜치 '${curBranch}'의 HEAD를 ${commitHash}로 변경했습니다.`));
    } else {
      console.error(chalk.red(`[ERROR] branch 파일이 존재하지 않습니다.`));
    }
  }

  /** 파일 복구 */
  restoreFiles() {

  }

  /** INDEX 파일 초기화 */
  clearIndex() {
    fs.writeFileSync(this.gitPaths.indexPath, '');
    console.log(chalk.gray('스테이징된 파일들(index)을 초기화했습니다.'));
  }
}