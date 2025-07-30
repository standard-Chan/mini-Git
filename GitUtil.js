import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { createHash } from 'crypto';

export default class GitUtil {
  static #instance;

  constructor(rootPath) {
    if (GitUtil.#instance) {
      return GitUtil.#instance;
    }

    this.rootPath = rootPath;
    this.gitPath = path.join(rootPath, ".git");

    this.objectsPath = path.join(this.gitPath, "objects");
    this.headPath = path.join(this.gitPath, "HEAD");
    this.refsHeadsPath = path.join(this.gitPath, "refs", "heads");
    this.indexPath = path.join(this.gitPath, "index");

    GitUtil.#instance = this;
  }

  /** 싱글톤 객체 */
  static getInstance() {
    if (!GitUtil.#instance) {
      throw new Error("GitUtil 인스턴스가 아직 생성되지 않았습니다. 객체를 먼저 생성하십시오.");
    }
    return GitUtil.#instance;
  }

  /** 현재 HEAD가 가리키는 브랜치의 커밋 해시를 반환 */
  getCurrentCommitHash() {
    const headContent = this.readFile(this.headPath).toString();

    const branchName = headContent.slice(5).trim(); // "ref: refs/heads/master" → "refs/heads/master"
    const branchPath = path.join(this.gitPath, branchName);

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

  /** zlib 압축 */
  compress(content) {
    const contentBuffer = Buffer.from(content, 'utf-8');
    return zlib.deflateSync(contentBuffer);
  }

  /** 해당 경로의 파일을 읽기 */
  readFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }
}

