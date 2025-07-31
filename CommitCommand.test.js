import assert from 'assert';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { createHash } from 'crypto';
import CommitCommand from '../CommitCommand.js';
import GitUtil from '../GitUtil.js';
import { FILE_MODE } from '../constants.js';

describe('CommitCommand 테스트', function() {
  let commitCommand;
  let testRootPath;
  let testGitPath;
  let testObjectsPath;
  let testIndexPath;
  let testHeadPath;
  let gitUtil;

  beforeEach(function() {
    // 테스트용 임시 디렉토리 생성
    testRootPath = path.join(process.cwd(), 'test-temp-commit');
    testGitPath = path.join(testRootPath, '.git');
    testObjectsPath = path.join(testGitPath, 'objects');
    testIndexPath = path.join(testGitPath, 'index');
    testHeadPath = path.join(testGitPath, 'HEAD');
    const refsPath = path.join(testGitPath, 'refs');
    const headsPath = path.join(refsPath, 'heads');

    // 디렉토리 구조 생성
    fs.mkdirSync(testRootPath, { recursive: true });
    fs.mkdirSync(testGitPath, { recursive: true });
    fs.mkdirSync(testObjectsPath, { recursive: true });
    fs.mkdirSync(refsPath, { recursive: true });
    fs.mkdirSync(headsPath, { recursive: true });

    // HEAD 파일 생성
    fs.writeFileSync(testHeadPath, 'ref: refs/heads/main\n');

    // main 브랜치 파일 생성
    const mainBranchPath = path.join(headsPath, 'main');
    fs.writeFileSync(mainBranchPath, 'abc123\n');

    // 테스트용 index 파일 생성 (스테이징 된 파일들)
    const indexContent = [
      `${FILE_MODE.REGULAR} hash1 file1.txt`,
      `${FILE_MODE.REGULAR} hash2 dir1/file2.txt`,
      `${FILE_MODE.REGULAR} hash3 dir1/dir2/file3.txt`
    ].join('\n');
    fs.writeFileSync(testIndexPath, indexContent);

    // GitUtil 인스턴스 생성
    gitUtil = new GitUtil(testRootPath);
    commitCommand = new CommitCommand(testRootPath);
  });

  afterEach(function() {
    // GitUtil 싱글톤 인스턴스 초기화
    GitUtil._instance = null;
    
    // 테스트 후 임시 디렉토리 삭제
    if (fs.existsSync(testRootPath)) {
      fs.rmSync(testRootPath, { recursive: true, force: true });
    }
  });

  describe('constructor', function() {
    it('올바른 경로로 초기화되어야 한다', function() {
      assert.strictEqual(commitCommand.rootPath, testRootPath);
      assert.strictEqual(commitCommand.gitPath, testGitPath);
      assert.strictEqual(commitCommand.objectsPath, testObjectsPath);
      assert.strictEqual(commitCommand.indexPath, testIndexPath);
      assert.strictEqual(commitCommand.headPath, testHeadPath);
      assert(commitCommand.gitUtil instanceof GitUtil);
    });
  });

  describe('readIndex', function() {
    it('index 파일을 올바르게 파싱해야 한다', function() {
      const entries = commitCommand.readIndex();

      assert.strictEqual(entries.length, 3, '3개의 엔트리가 있어야 한다');
      
      assert.strictEqual(entries[0].fileMode, FILE_MODE.REGULAR);
      assert.strictEqual(entries[0].hash, 'hash1');
      assert.strictEqual(entries[0].filePath, 'file1.txt');

      assert.strictEqual(entries[1].fileMode, FILE_MODE.REGULAR);
      assert.strictEqual(entries[1].hash, 'hash2');
      assert.strictEqual(entries[1].filePath, 'dir1/file2.txt');

      assert.strictEqual(entries[2].fileMode, FILE_MODE.REGULAR);
      assert.strictEqual(entries[2].hash, 'hash3');
      assert.strictEqual(entries[2].filePath, 'dir1/dir2/file3.txt');
    });

    it('빈 index 파일을 처리할 수 있어야 한다', function() {
      fs.writeFileSync(testIndexPath, '');
      
      const entries = commitCommand.readIndex();
      assert.strictEqual(entries.length, 0, '빈 배열이 반환되어야 한다');
    });
  });

  describe('insertIntoTree', function() {
    it('단순한 파일 경로를 트리에 삽입해야 한다', function() {
      let tree = {};
      const result = commitCommand.insertIntoTree(tree, 'file.txt', FILE_MODE.REGULAR, 'hash123');

      assert(result['file.txt'], 'file.txt가 트리에 존재해야 한다');
      assert.strictEqual(result['file.txt'].fileMode, FILE_MODE.REGULAR);
      assert.strictEqual(result['file.txt'].filename, 'file.txt');
      assert.strictEqual(result['file.txt'].hash, 'hash123');
    });

    it('중첩된 디렉토리 구조를 올바르게 생성해야 한다', function() {
      let tree = {};
      const result = commitCommand.insertIntoTree(tree, 'a/b/file.txt', FILE_MODE.REGULAR, 'hash456');

      assert(result['a'], 'a 디렉토리가 존재해야 한다');
      assert(result['a']['b'], 'b 디렉토리가 존재해야 한다');
      assert(result['a']['b']['file.txt'], 'file.txt가 존재해야 한다');
      assert.strictEqual(result['a']['b']['file.txt'].fileMode, FILE_MODE.REGULAR);
      assert.strictEqual(result['a']['b']['file.txt'].filename, 'file.txt');
      assert.strictEqual(result['a']['b']['file.txt'].hash, 'hash456');
    });

    it('기존 트리에 새로운 파일을 추가할 수 있어야 한다', function() {
      let tree = {};
      commitCommand.insertIntoTree(tree, 'dir1/file1.txt', FILE_MODE.REGULAR, 'hash1');
      commitCommand.insertIntoTree(tree, 'dir1/file2.txt', FILE_MODE.REGULAR, 'hash2');
      commitCommand.insertIntoTree(tree, 'dir2/file3.txt', FILE_MODE.REGULAR, 'hash3');

      assert(tree['dir1']['file1.txt'], 'dir1/file1.txt가 존재해야 한다');
      assert(tree['dir1']['file2.txt'], 'dir1/file2.txt가 존재해야 한다');
      assert(tree['dir2']['file3.txt'], 'dir2/file3.txt가 존재해야 한다');
    });
  });

  describe('convertEntriesToTree', function() {
    it('index 엔트리들을 트리 구조로 변환해야 한다', function() {
      const entries = [
        { fileMode: FILE_MODE.REGULAR, hash: 'hash1', filePath: 'file1.txt' },
        { fileMode: FILE_MODE.REGULAR, hash: 'hash2', filePath: 'dir1/file2.txt' },
        { fileMode: FILE_MODE.REGULAR, hash: 'hash3', filePath: 'dir1/dir2/file3.txt' }
      ];

      const tree = commitCommand.convertEntriesToTree(entries);

      assert(tree.root, 'root 속성이 존재해야 한다');
      assert(tree.root['file1.txt'], 'file1.txt가 root에 존재해야 한다');
      assert(tree.root['dir1'], 'dir1이 root에 존재해야 한다');
      assert(tree.root['dir1']['file2.txt'], 'file2.txt가 dir1에 존재해야 한다');
      assert(tree.root['dir1']['dir2'], 'dir2가 dir1에 존재해야 한다');
      assert(tree.root['dir1']['dir2']['file3.txt'], 'file3.txt가 dir2에 존재해야 한다');
    });
  });

  describe('createCommitContent', function() {
    it('올바른 커밋 내용을 생성해야 한다', function() {
      const message = 'Test commit';
      const author = 'Test User';
      const email = 'test@example.com';
      const rootHash = 'treehash123';
      const parentHash = 'parenthash456';

      const content = commitCommand.createCommitContent(message, author, email, rootHash, parentHash);

      assert(content.startsWith('commit '), '커밋 헤더로 시작해야 한다');
      assert(content.includes('\0'), 'null 문자가 포함되어야 한다');
      
      const [header, body] = content.split('\0');
      assert(body.includes(`tree ${rootHash}`), 'tree 해시가 포함되어야 한다');
      assert(body.includes(`parent ${parentHash}`), 'parent 해시가 포함되어야 한다');
      assert(body.includes(`author ${author} <${email}>`), 'author 정보가 포함되어야 한다');
      assert(body.includes(`committer ${author} <${email}>`), 'committer 정보가 포함되어야 한다');
      assert(body.includes(message), '커밋 메시지가 포함되어야 한다');
    });

    it('parent가 없는 초기 커밋 내용을 생성해야 한다', function() {
      const message = 'Initial commit';
      const author = 'Test User';
      const email = 'test@example.com';
      const rootHash = 'treehash123';

      const content = commitCommand.createCommitContent(message, author, email, rootHash, null);

      const [header, body] = content.split('\0');
      assert(body.includes(`tree ${rootHash}`), 'tree 해시가 포함되어야 한다');
      assert(!body.includes('parent'), 'parent 라인이 없어야 한다');
      assert(body.includes(`author ${author} <${email}>`), 'author 정보가 포함되어야 한다');
      assert(body.includes(message), '커밋 메시지가 포함되어야 한다');
    });
  });

  describe('createTreeObject', function() {
    it('트리 객체를 생성하고 해시를 반환해야 한다', function() {
      const content = `${FILE_MODE.REGULAR} file1.txt\0hash1\n${FILE_MODE.REGULAR} file2.txt\0hash2`;
      
      const hash = commitCommand.createTreeObject(content);

      // 해시가 40자 16진수 문자열인지 확인
      assert.strictEqual(hash.length, 40, '해시는 40자여야 한다');
      assert(/^[a-f0-9]+$/.test(hash), '해시는 16진수 문자열이어야 한다');

      // 트리 객체가 저장되었는지 확인
      const objectDir = path.join(testObjectsPath, hash.slice(0, 2));
      const objectFile = path.join(objectDir, hash);
      assert(fs.existsSync(objectFile), '트리 객체 파일이 생성되어야 한다');
    });
  });

  describe('clearIndex', function() {
    it('index 파일을 비워야 한다', function() {
      // index 파일에 내용이 있는지 확인
      const beforeContent = fs.readFileSync(testIndexPath, 'utf-8');
      assert(beforeContent.trim().length > 0, '초기 index 파일에 내용이 있어야 한다');

      // console.log 출력 캡처
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      commitCommand.clearIndex();

      console.log = originalLog;

      // index 파일이 비워졌는지 확인
      const afterContent = fs.readFileSync(testIndexPath, 'utf-8');
      assert.strictEqual(afterContent, '', 'index 파일이 비워져야 한다');

      // 성공 메시지 확인
      assert(output.includes('커밋이 성공하여'), '성공 메시지가 출력되어야 한다');
      assert(output.includes('스테이징된 파일들을 지웁니다'), '스테이징 파일 삭제 메시지가 출력되어야 한다');
    });
  });

  describe('updateHead', function() {
    it('HEAD가 가리키는 브랜치 파일을 업데이트해야 한다', function() {
      const newCommitHash = 'newcommithash123';
      const branchPath = path.join(testGitPath, 'refs', 'heads', 'main');

      // 초기 커밋 해시 확인
      const initialHash = fs.readFileSync(branchPath, 'utf-8').trim();
      assert.notStrictEqual(initialHash, newCommitHash, '초기 해시와 새 해시가 달라야 한다');

      commitCommand.updateHead(newCommitHash);

      // 브랜치 파일이 업데이트되었는지 확인
      const updatedHash = fs.readFileSync(branchPath, 'utf-8').trim();
      assert.strictEqual(updatedHash, newCommitHash, '브랜치 파일이 새 커밋 해시로 업데이트되어야 한다');
    });
  });

  describe('통합 테스트', function() {
    this.timeout(5000); // 통합 테스트는 시간이 더 걸릴 수 있음

    it('전체 트리 생성 프로세스가 정상 동작해야 한다', function() {
      // console.log 출력 캡처
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      const rootHash = commitCommand.createTree();

      console.log = originalLog;

      // 루트 해시가 반환되었는지 확인
      assert.strictEqual(typeof rootHash, 'string', '루트 해시가 문자열이어야 한다');
      assert.strictEqual(rootHash.length, 40, '루트 해시는 40자여야 한다');

      // 트리 객체가 생성되었는지 확인
      const objectDir = path.join(testObjectsPath, rootHash.slice(0, 2));
      const objectFile = path.join(objectDir, rootHash);
      assert(fs.existsSync(objectFile), '루트 트리 객체가 생성되어야 한다');

      // index가 비워졌는지 확인
      const indexContent = fs.readFileSync(testIndexPath, 'utf-8');
      assert.strictEqual(indexContent, '', 'index 파일이 비워져야 한다');

      // 성공 메시지 확인
      assert(output.includes('커밋이 성공하여'), '성공 메시지가 출력되어야 한다');
    });

    it('커밋 생성 전체 프로세스가 정상 동작해야 한다', function() {
      const message = 'Test commit message';
      const author = 'Test Author';
      const email = 'test@example.com';
      const rootHash = 'testhash123';

      // console.log 출력 캡처
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      const commitHash = commitCommand.createCommit(message, author, email, rootHash);

      console.log = originalLog;

      // 커밋 해시가 반환되었는지 확인
      assert.strictEqual(typeof commitHash, 'string', '커밋 해시가 문자열이어야 한다');
      assert.strictEqual(commitHash.length, 40, '커밋 해시는 40자여야 한다');

      // 커밋 객체가 생성되었는지 확인
      const objectDir = path.join(testObjectsPath, commitHash.slice(0, 2));
      const objectFile = path.join(objectDir, commitHash);
      assert(fs.existsSync(objectFile), '커밋 객체가 생성되어야 한다');

      // 커밋 객체 내용 확인
      const compressedContent = fs.readFileSync(objectFile);
      const decompressed = zlib.inflateSync(compressedContent).toString();
      const [header, content] = decompressed.split('\0');
      
      assert(content.includes(`tree ${rootHash}`), '커밋에 트리 해시가 포함되어야 한다');
      assert(content.includes(`author ${author} <${email}>`), '커밋에 작성자 정보가 포함되어야 한다');
      assert(content.includes(message), '커밋에 메시지가 포함되어야 한다');

      // 성공 메시지 확인
      assert(output.includes('커밋 완료'), '커밋 완료 메시지가 출력되어야 한다');
      assert(output.includes(commitHash), '커밋 해시가 메시지에 포함되어야 한다');
    });

    it('복잡한 디렉토리 구조도 올바르게 처리해야 한다', function() {
      // 더 복잡한 index 구조 생성
      const complexIndexContent = [
        `${FILE_MODE.REGULAR} hash1 README.md`,
        `${FILE_MODE.REGULAR} hash2 src/main.js`,
        `${FILE_MODE.REGULAR} hash3 src/utils/helper.js`,
        `${FILE_MODE.REGULAR} hash4 src/utils/validator.js`,
        `${FILE_MODE.REGULAR} hash5 test/main.test.js`,
        `${FILE_MODE.REGULAR} hash6 docs/api.md`,
        `${FILE_MODE.REGULAR} hash7 assets/images/logo.png`
      ].join('\n');
      
      fs.writeFileSync(testIndexPath, complexIndexContent);

      const rootHash = commitCommand.createTree();

      // 루트 해시가 생성되었는지 확인
      assert.strictEqual(typeof rootHash, 'string', '루트 해시가 생성되어야 한다');
      assert.strictEqual(rootHash.length, 40, '루트 해시는 40자여야 한다');

      // 여러 트리 객체들이 생성되었는지 확인 (src, test, docs, assets 등)
      const objectsCreated = fs.readdirSync(testObjectsPath);
      assert(objectsCreated.length > 1, '여러 트리 객체가 생성되어야 한다');
    });
  });
});
