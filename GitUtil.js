import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { createHash } from 'crypto';
import GitPaths from './GitPaths.js';

export default class GitUtil {
  static #instance;

  constructor(rootPath) {
    if (GitUtil.#instance) {
      return GitUtil.#instance;
    }

    this.rootPath = rootPath;
    this.gitPaths = GitPaths.of(rootPath);

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
    try {
      const headContent = this.readFile(this.gitPaths.headPath).trim();

      if (!headContent.startsWith('ref:')) {
        // HEAD가 직접 커밋 해시를 가리키는 경우 (detached HEAD)
        return headContent;
      }

      const branchName = headContent.slice(5).trim(); // "ref: refs/heads/master" → "refs/heads/master"
      const branchPath = path.join(this.gitPaths.gitPath, branchName);

      if (!fs.existsSync(branchPath)) {
        // 브랜치 파일이 없는 경우 (아직 커밋이 없음)
        return null;
      }

      const commitHash = fs.readFileSync(branchPath, 'utf-8').trim();
      return commitHash || null;
    } catch (error) {
      return null;
    }
  }

  /** 현재 브랜치명 반환 */
  getCurrentBranch() {
    try {
      const headContent = this.readFile(this.gitPaths.headPath).trim();
      
      if (!headContent.startsWith('ref:')) {
        // detached HEAD 상태
        return 'HEAD';
      }

      const branchPath = headContent.slice(5).trim(); // "ref: refs/heads/master" → "refs/heads/master"
      return branchPath.slice(branchPath.lastIndexOf('/') + 1);
    } catch (error) {
      return 'main'; // 기본값
    }
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

  /** 객체 저장 */
  saveObject(filename, content) {
    // 앞 2글자로 디렉토리 생성하기
    const dir = path.join(this.gitPaths.objectsPath, filename.slice(0, 2));
    const objectPath = path.join(dir, filename.slice(2));

    // 디렉토리 생성 (ex: objects/{hash값 앞 2글자}/{hash값 나머지})
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(objectPath, content);
  }

  /** 객체 읽기 */
  readObject(hash) {
    const dir = path.join(this.gitPaths.objectsPath, hash.slice(0, 2));
    const objectPath = path.join(dir, hash.slice(2));

    if (!fs.existsSync(objectPath)) {
      throw new Error(`객체를 찾을 수 없습니다: ${hash}`);
    }

    const compressed = fs.readFileSync(objectPath);
    return zlib.inflateSync(compressed).toString();
  }

  /** 브랜치 존재 여부 확인 */
  branchExists(branchName) {
    const branchPath = path.join(this.gitPaths.refsHeadsPath, branchName);
    return fs.existsSync(branchPath);
  }

  /** 브랜치 목록 반환 */
  getBranches() {
    if (!fs.existsSync(this.gitPaths.refsHeadsPath)) {
      return [];
    }

    return fs.readdirSync(this.gitPaths.refsHeadsPath)
      .filter(file => {
        const fullPath = path.join(this.gitPaths.refsHeadsPath, file);
        return fs.statSync(fullPath).isFile();
      });
  }

  /** 인덱스 파일이 비어있는지 확인 */
  isIndexEmpty() {
    try {
      const indexContent = this.readFile(this.gitPaths.indexPath).trim();
      return indexContent === '';
    } catch (error) {
      return true;
    }
  }
}