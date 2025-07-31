import path from 'path';
import InitCommand from './InitCommand.js';
import branchCommand from './BranchCommand.js';
import GitUtil from './GitUtil.js';
import SwitchCommand from './SwitchCommand.js';
import AddCommand from './AddCommand.js';
import CommitCommand from './CommitCommand.js';
import LogCommand from './LogCommand.js';
import GitPaths from './GitPaths.js';

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
    const indexLines = this.gitUtil.readFile(this.gitPaths.indexPath).split('\n').filter(e=>e);

    console.log('현재 스테이징된 파일들');
    indexLines.forEach(line => {
      const [fileMode, hash, fileName] = line.split(' ');
      console.log(`- ${fileName} : ${hash}`);
    });
  }

  commit(message='null', author='null', email) {
    const rootHash = this.commitCommand.createTree();
    const commitHash = this.commitCommand.createCommit(message, author, email, rootHash);
    this.commitCommand.updateHead(commitHash)
  }

  log() {
    this.logCommand.log();
  }
}
