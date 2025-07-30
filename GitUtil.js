import fs from 'fs';
import path from 'path';

export default class GitUtil {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");

    this.objectsPath = path.join(this.gitPath, "objects");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
    this.indexPath = path.join(this.gitPath, "index");
  }

  /** 현재 HEAD가 가리키는 브랜치의 커밋 해시를 반환 */
  getCurrentCommitHash(rootPath) {
    const headContent = fs.readFileSync(this.headPath, 'utf-8').trim();

    if (!headContent.startsWith('ref: ')) {
      throw new Error('HEAD가 브랜치를 참조하지 않고 직접 커밋 해시를 가리키고 있음 (detached HEAD)');
    }

    const branchName = headContent.slice(5); // "ref: refs/heads/master" 에서 경로만 추출
    const branchPath = path.join(this.gitPath, branchName); // 경로 저장
    console.log(branchPath);

    if (!fs.existsSync(branchPath)) {
      throw new Error(`HEAD가 참조하는 브랜치 파일(${branchPath})이 존재하지 않습니다.`);
    }

    const commitHash = fs.readFileSync(branchPath, 'utf-8').trim();
    return commitHash;
  }
}