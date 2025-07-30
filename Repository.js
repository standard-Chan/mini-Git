import path from 'path';
import InitCommand from './InitCommand';

class Repository {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");

    this.objectsPath = path.join(this.gitPath, "objects");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
    this.indexPath = path.join(this.gitPath, "index");
  }

  /** git 초기화 */
  init() {
    InitCommand.initDirectories(this.rootPath);
    InitCommand.initHeadFile(this.headPath);
    InitCommand.initIndexFile(this.indexPath);
    InitCommand.initBranchFile(this.refsHeadsPath);
  }

  
  add(filePath) {
    // 1. 파일 읽고 blob 생성
    // 2. blob 저장하고, index에 기록
  }

  commit(message) {
    // 1. index 읽고 tree 생성
    // 2. tree와 HEAD를 기반으로 commit object 생성
    // 3. HEAD 업데이트
  }

  branch(name) {
    // 1. 현재 HEAD가 가리키는 커밋 해시 읽기
    // 2. refs/heads/ 새 브랜치 파일에 그 해시 저장
  }

  log() {
    // HEAD에서 커밋 거슬러 올라가며 메시지 출력
  }
}
