import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';


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

    const branchName = headContent.slice(5); // 브랜치 경로 추출 ("ref: refs/heads/master"에서 경로만 추출)
    const branchPath = path.join(this.gitPath, branchName); // 경로 저장
    console.log(branchPath);

    if (!fs.existsSync(branchPath)) {
      throw new Error(`HEAD가 참조하는 브랜치 파일(${branchPath})이 존재하지 않습니다.`);
    }

    const commitHash = fs.readFileSync(branchPath, 'utf-8').trim();
    return commitHash;
  }


  /** sha1 해시값을 반환 */
  getSha1Hash(content) {
    return createHash('sha1').update(content).digest('hex');
  }


}