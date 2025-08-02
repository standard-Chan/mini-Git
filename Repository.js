import InitCommand from './command/InitCommand.js';
import branchCommand from './command/BranchCommand.js';
import GitUtil from './GitUtil.js';
import SwitchCommand from './command/SwitchCommand.js';
import AddCommand from './command/AddCommand.js';
import CommitCommand from './command/CommitCommand.js';
import LogCommand from './command/LogCommand.js';
import GitPaths from './GitPaths.js';
import chalk from 'chalk';

export default class Repository {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPaths = GitPaths.of(rootPath);

    this.gitUtil = GitUtil.getInstance();
    this.branchCommand = new branchCommand(rootPath);
    this.switchCommand = new SwitchCommand(rootPath);
    this.addCommand = new AddCommand(rootPath);
    this.commitCommand = new CommitCommand(rootPath);
    this.logCommand = new LogCommand(rootPath);
  }

  /** git 초기화 */
  init() {
    InitCommand.initDirectories(this.rootPath);
    InitCommand.initHeadFile(this.gitPaths.headPath);
    InitCommand.initIndexFile(this.gitPaths.indexPath);
    InitCommand.initBranchFile(this.gitPaths.refsHeadsPath);
  }

  branch(name = null, option = null) {
    if (!name) {
      this.branchCommand.printBranchList();  // 브랜치 목록 출력
      return;
    }

    // 브랜치 생성
    const curCommitHash = this.gitUtil.getCurrentCommitHash();      // 현재 HEAD가 가리키는 커밋 해시 읽기
    this.branchCommand.createBranch(name, curCommitHash);           // refs/heads/ 에 브랜치 파일 생성
  }

  switch(branchName) {
    this.switchCommand.moveHeadTo(branchName);
  }

  add(filePath) {
    this.addCommand.add(filePath);
  }

  status() {
    const indexLines = this.gitUtil.readFile(this.gitPaths.indexPath, 'utf-8')
      .split('\n')
      .filter(e => e);

    const branch = this.gitUtil.getCurrentBranch();

    console.log(
      `${chalk.bold('현재 branch')} [${chalk.cyanBright(branch)}] - ${chalk.gray('스테이징된 파일 목록')}`
    );

    if (indexLines.length === 0) {
      console.log(chalk.gray('  (스테이징된 파일이 없습니다.)'));
    }

    indexLines.forEach(line => {
      const [fileMode, hash, fileName] = line.split(' ');
      console.log(`  ${chalk.greenBright('-')} ${chalk.greenBright(fileName)} : ${chalk.yellow(hash)}`);
    });

    console.log(); // 줄바꿈
  }

  commit(message = 'null', author = 'null', email) {
    const rootHash = this.commitCommand.createTree();
    const commitHash = this.commitCommand.createCommit(message, author, email, rootHash);
    this.commitCommand.updateHead(commitHash)
  }

  log() {
    this.logCommand.log();
  }
}
