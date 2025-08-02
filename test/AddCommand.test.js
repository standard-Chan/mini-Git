import assert from 'assert';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { createHash } from 'crypto';
import AddCommand from './AddCommand.js';
import GitUtil from '../GitUtil.js';
import { FILE_MODE } from '../constants.js';

describe('AddCommand 테스트', function() {
  let addCommand;
  let testRootPath;
  let testGitPath;
  let testObjectsPath;
  let testIndexPath;
  let testFilePath;
  let gitUtil;

  beforeEach(function() {
    // 테스트용 임시 디렉토리 생성
    testRootPath = path.join(process.cwd(), 'test-temp-add');
    testGitPath = path.join(testRootPath, '.git');
    testObjectsPath = path.join(testGitPath, 'objects');
    testIndexPath = path.join(testGitPath, 'index');
    const refsPath = path.join(testGitPath, 'refs');
    const headsPath = path.join(refsPath, 'heads');

    // 디렉토리 구조 생성
    fs.mkdirSync(testRootPath, { recursive: true });
    fs.mkdirSync(testGitPath, { recursive: true });
    fs.mkdirSync(testObjectsPath, { recursive: true });
    fs.mkdirSync(refsPath, { recursive: true });
    fs.mkdirSync(headsPath, { recursive: true });

    // 테스트용 파일 생성
    testFilePath = path.join(testRootPath, 'test.txt');
    fs.writeFileSync(testFilePath, 'Hello World');

    // HEAD 파일 생성
    const headPath = path.join(testGitPath, 'HEAD');
    fs.writeFileSync(headPath, 'ref: refs/heads/main\n');

    // main 브랜치 파일 생성
    const mainBranchPath = path.join(headsPath, 'main');
    fs.writeFileSync(mainBranchPath, 'abc123\n');

    // GitUtil 인스턴스 생성 (싱글톤)
    gitUtil = new GitUtil(testRootPath);
    addCommand = new AddCommand(testRootPath);
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
      assert.strictEqual(addCommand.rootPath, testRootPath);
      assert.strictEqual(addCommand.gitPath, testGitPath);
      assert.strictEqual(addCommand.objectsPath, testObjectsPath);
      assert.strictEqual(addCommand.indexPath, testIndexPath);
      assert(addCommand.gitUtil instanceof GitUtil);
    });
  });

  describe('add', function() {
    it('파일을 스테이징 영역에 추가해야 한다', function() {
      // console.log 출력 캡처
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      addCommand.add(testFilePath);

      console.log = originalLog;

      // index 파일이 생성되었는지 확인
      assert(fs.existsSync(testIndexPath), 'index 파일이 생성되어야 한다');

      // index 파일 내용 확인
      const indexContent = fs.readFileSync(testIndexPath, 'utf-8');
      assert(indexContent.includes(testFilePath), 'index에 파일 경로가 포함되어야 한다');
      assert(indexContent.includes(FILE_MODE.EXE), 'index에 파일 모드가 포함되어야 한다');

      // blob 파일이 생성되었는지 확인
      const fileContent = 'Hello World';
      const expectedHash = createHash('sha1').update(fileContent).digest('hex');
      const blobDir = path.join(testObjectsPath, expectedHash.slice(0, 2));
      const blobPath = path.join(blobDir, expectedHash);
      assert(fs.existsSync(blobPath), 'blob 파일이 생성되어야 한다');

      // 성공 메시지 확인
      assert(output.includes('staged'), '성공 메시지가 출력되어야 한다');
    });
  });

  describe('saveBlob', function() {
    it('blob 파일을 올바른 경로에 저장해야 한다', function() {
      const testHash = 'abc123def456';
      const testContent = Buffer.from('test content');

      addCommand.saveBlob(testHash, testContent);

      const expectedDir = path.join(testObjectsPath, testHash.slice(0, 2));
      const expectedPath = path.join(expectedDir, testHash);

      assert(fs.existsSync(expectedDir), 'blob 디렉토리가 생성되어야 한다');
      assert(fs.existsSync(expectedPath), 'blob 파일이 생성되어야 한다');

      const savedContent = fs.readFileSync(expectedPath);
      assert(savedContent.equals(testContent), '저장된 내용이 일치해야 한다');
    });

    it('이미 존재하는 디렉토리에도 파일을 저장할 수 있어야 한다', function() {
      const testHash1 = 'abc123def456';
      const testHash2 = 'abcdefghijkl';
      const testContent1 = Buffer.from('content 1');
      const testContent2 = Buffer.from('content 2');

      addCommand.saveBlob(testHash1, testContent1);
      addCommand.saveBlob(testHash2, testContent2);

      const expectedPath1 = path.join(testObjectsPath, testHash1.slice(0, 2), testHash1);
      const expectedPath2 = path.join(testObjectsPath, testHash2.slice(0, 2), testHash2);

      assert(fs.existsSync(expectedPath1), '첫 번째 blob 파일이 존재해야 한다');
      assert(fs.existsSync(expectedPath2), '두 번째 blob 파일이 존재해야 한다');
    });
  });

  describe('#getFileMode', function() {
    it('일반 파일의 파일 모드를 반환해야 한다', function() {
      // private 메서드 테스트를 위해 add 메서드를 통해 간접적으로 테스트
      addCommand.add(testFilePath);

      const indexContent = fs.readFileSync(testIndexPath, 'utf-8');
      assert(indexContent.includes(FILE_MODE.EXE), '일반 파일의 파일 모드가 설정되어야 한다');
    });

    it('디렉토리의 파일 모드를 반환해야 한다', function() {
      // 테스트용 디렉토리 생성
      const testDirPath = path.join(testRootPath, 'testdir');
      fs.mkdirSync(testDirPath);

      // console.log 출력 캡처
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      addCommand.add(testDirPath);

      console.log = originalLog;

      // 디렉토리는 현재 지원되지 않는다는 메시지가 출력되어야 함
      assert(output.includes('디렉토리'), '디렉토리 처리 메시지가 출력되어야 한다');
      assert(output.includes('지원되지 않습니다'), '지원되지 않는다는 메시지가 출력되어야 한다');
    });
  });

  describe('saveToIndex', function() {
    it('index 파일에 올바른 형식으로 정보를 저장해야 한다', function() {
      const testHash = 'abc123def456';
      const testMode = FILE_MODE.REGULAR;
      const testPath = 'test/file.txt';

      addCommand.saveToIndex(testHash, testMode, testPath);

      assert(fs.existsSync(testIndexPath), 'index 파일이 생성되어야 한다');

      const indexContent = fs.readFileSync(testIndexPath, 'utf-8');
      const expectedEntry = `${testMode} ${testHash} ${testPath}\n`;
      assert.strictEqual(indexContent, expectedEntry, '올바른 형식으로 저장되어야 한다');
    });

    it('여러 파일 정보를 누적하여 저장해야 한다', function() {
      const entries = [
        { hash: 'hash1', mode: FILE_MODE.REGULAR, path: 'file1.txt' },
        { hash: 'hash2', mode: FILE_MODE.EXE, path: 'file2.txt' },
        { hash: 'hash3', mode: FILE_MODE.DIR, path: 'dir1' }
      ];

      entries.forEach(entry => {
        addCommand.saveToIndex(entry.hash, entry.mode, entry.path);
      });

      const indexContent = fs.readFileSync(testIndexPath, 'utf-8');
      const lines = indexContent.trim().split('\n');

      assert.strictEqual(lines.length, 3, '3개의 엔트리가 저장되어야 한다');

      entries.forEach((entry, index) => {
        const expectedLine = `${entry.mode} ${entry.hash} ${entry.path}`;
        assert.strictEqual(lines[index], expectedLine, `${index + 1}번째 엔트리가 올바르게 저장되어야 한다`);
      });
    });
  });

  describe('compress', function() {
    it('내용을 올바른 blob 형식으로 압축해야 한다', function() {
      const testContent = 'Hello World';
      const expectedFormat = `blob ${testContent.length}\0${testContent}`;

      const compressed = addCommand.compress(testContent);

      // 압축 해제하여 확인
      const decompressed = zlib.inflateSync(compressed).toString();
      assert.strictEqual(decompressed, expectedFormat, '올바른 blob 형식으로 압축되어야 한다');
    });

    it('빈 내용도 압축할 수 있어야 한다', function() {
      const testContent = '';
      const expectedFormat = `blob ${testContent.length}\0${testContent}`;

      const compressed = addCommand.compress(testContent);

      const decompressed = zlib.inflateSync(compressed).toString();
      assert.strictEqual(decompressed, expectedFormat, '빈 내용도 올바르게 압축되어야 한다');
    });

    it('긴 내용도 압축할 수 있어야 한다', function() {
      const testContent = 'a'.repeat(1000);
      const expectedFormat = `blob ${testContent.length}\0${testContent}`;

      const compressed = addCommand.compress(testContent);

      const decompressed = zlib.inflateSync(compressed).toString();
      assert.strictEqual(decompressed, expectedFormat, '긴 내용도 올바르게 압축되어야 한다');
    });

    it('특수 문자가 포함된 내용도 압축할 수 있어야 한다', function() {
      const testContent = 'Hello\nWorld\t한글\u0000';
      const expectedFormat = `blob ${testContent.length}\0${testContent}`;

      const compressed = addCommand.compress(testContent);

      const decompressed = zlib.inflateSync(compressed).toString();
      assert.strictEqual(decompressed, expectedFormat, '특수 문자가 포함된 내용도 올바르게 압축되어야 한다');
    });
  });

  describe('통합 테스트', function() {
    it('파일 추가 전체 프로세스가 정상 동작해야 한다', function() {
      const testContent = 'Integration test content';
      const integrationTestFile = path.join(testRootPath, 'integration.txt');
      fs.writeFileSync(integrationTestFile, testContent);

      // console.log 출력 캡처
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      addCommand.add(integrationTestFile);

      console.log = originalLog;

      // 1. index 파일 확인
      assert(fs.existsSync(testIndexPath), 'index 파일이 생성되어야 한다');
      const indexContent = fs.readFileSync(testIndexPath, 'utf-8');
      assert(indexContent.includes(integrationTestFile), 'index에 파일 경로가 포함되어야 한다');

      // 2. blob 파일 확인
      const expectedHash = createHash('sha1').update(testContent).digest('hex');
      const blobDir = path.join(testObjectsPath, expectedHash.slice(0, 2));
      const blobPath = path.join(blobDir, expectedHash);
      assert(fs.existsSync(blobPath), 'blob 파일이 생성되어야 한다');

      // 3. blob 내용 확인 (압축 해제)
      const compressedContent = fs.readFileSync(blobPath);
      const decompressed = zlib.inflateSync(compressedContent).toString();
      const expectedBlobFormat = `blob ${testContent.length}\0${testContent}`;
      assert.strictEqual(decompressed, expectedBlobFormat, 'blob 내용이 올바르게 저장되어야 한다');

      // 4. 성공 메시지 확인
      assert(output.includes('staged'), '성공 메시지가 출력되어야 한다');
      assert(output.includes(integrationTestFile), '파일 경로가 메시지에 포함되어야 한다');
      assert(output.includes(expectedHash), '해시값이 메시지에 포함되어야 한다');
    });

    it('여러 파일을 연속으로 추가할 수 있어야 한다', function() {
      const files = [
        { name: 'file1.txt', content: 'Content 1' },
        { name: 'file2.txt', content: 'Content 2' },
        { name: 'file3.txt', content: 'Content 3' }
      ];

      // 파일들 생성 및 추가
      files.forEach(file => {
        const filePath = path.join(testRootPath, file.name);
        fs.writeFileSync(filePath, file.content);
        addCommand.add(filePath);
      });

      // index 파일 확인
      const indexContent = fs.readFileSync(testIndexPath, 'utf-8');
      const indexLines = indexContent.trim().split('\n');
      assert.strictEqual(indexLines.length, files.length, '모든 파일이 index에 추가되어야 한다');

      // 각 파일의 blob 확인
      files.forEach(file => {
        const expectedHash = createHash('sha1').update(file.content).digest('hex');
        const blobPath = path.join(testObjectsPath, expectedHash.slice(0, 2), expectedHash);
        assert(fs.existsSync(blobPath), `${file.name}의 blob 파일이 존재해야 한다`);
      });
    });
  });
});
