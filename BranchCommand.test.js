import assert from 'assert';
import fs from 'fs';
import path from 'path';
import BranchCommand from './BranchCommand.js';
import Repository from './Repository.js';
import GitUtil from './GitUtil.js';

describe('BranchCommand 테스트', function() {
  let branchCommand;
  let testGitPath;
  let rootPath;

  beforeEach(function() {
    // 테스트용 임시 디렉토리 생성
    rootPath = 'test';
    testGitPath = 'test/.git'
    new GitUtil(rootPath);
    const repo = new Repository(rootPath);
    
    repo.init();

    branchCommand = new BranchCommand(rootPath);
  });

  afterEach(function() {
    // 테스트 후 임시 디렉토리 삭제
    if (fs.existsSync(rootPath)) {
      fs.rmSync(rootPath, { recursive: true, force: true });
    }
  });

  describe('printBranchList', () => {
    it('브랜치 목록 출력', function() {
      // console.log 출력 캡처
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      branchCommand.printBranchList();

      // console.log 복원
      console.log = originalLog;

      assert(output.includes('브랜치 목록:'));
      assert(output.includes('- master'));
    });

    it('빈 브랜치 디렉토리에서도 정상 동작해야 한다', function() {
      // 모든 브랜치 파일 삭제
      const headsPath = path.join(testGitPath, 'refs', 'heads');
      fs.readdirSync(headsPath).forEach(file => {
        fs.unlinkSync(path.join(headsPath, file));
      });

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      branchCommand.printBranchList();
      console.log = originalLog;

      assert(output.includes('브랜치 목록:'));
    });
  });

  describe('createBranch', function() {
    it('새로운 브랜치를 생성해야 한다', function() {
      const branchName = 'feature/new-feature';
      const commitHash = 'xyz789';

      branchCommand.createBranch(branchName, commitHash);

      const branchPath = path.join(testGitPath, 'refs', 'heads', branchName);
      assert(fs.existsSync(branchPath), '브랜치 파일이 생성되어야 한다');
      
      const content = fs.readFileSync(branchPath, 'utf8');
      assert.strictEqual(content, commitHash + '\n', '올바른 커밋 해시가 저장되어야 한다');
    });

    it('이미 존재하는 브랜치를 덮어써야 한다', function() {
      const branchName = 'main';
      const newCommitHash = 'newHash123';

      branchCommand.createBranch(branchName, newCommitHash);

      const branchPath = path.join(testGitPath, 'refs', 'heads', branchName);
      const content = fs.readFileSync(branchPath, 'utf8');
      assert.strictEqual(content, newCommitHash + '\n', '새로운 커밋 해시로 덮어써져야 한다');
    });

    it('긴 브랜치 이름도 처리할 수 있어야 한다', function() {
      const longBranchName = 'feature/very-long-branch-name-with-many-hyphens-and-words';
      const commitHash = 'longBranchHash';

      branchCommand.createBranch(longBranchName, commitHash);

      const branchPath = path.join(testGitPath, 'refs', 'heads', longBranchName);
      assert(fs.existsSync(branchPath), '긴 이름의 브랜치 파일이 생성되어야 한다');
    });

    it('특수 문자가 포함된 커밋 해시도 저장할 수 있어야 한다', function() {
      const branchName = 'test-branch';
      const commitHash = 'abc123def456ghi789';

      branchCommand.createBranch(branchName, commitHash);

      const branchPath = path.join(testGitPath, 'refs', 'heads', branchName);
      const content = fs.readFileSync(branchPath, 'utf8');
      assert.strictEqual(content, commitHash + '\n');
    });
  });

  describe('통합 테스트', function() {
    it('브랜치 생성 후 목록에서 확인할 수 있어야 한다', function() {
      const newBranchName = 'integration-test';
      const commitHash = 'integration123';

      // 브랜치 생성
      branchCommand.createBranch(newBranchName, commitHash);

      // 브랜치 목록 확인
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      branchCommand.printBranchList();
      console.log = originalLog;

      assert(output.includes(`- ${newBranchName}`), '생성한 브랜치가 목록에 나타나야 한다');
    });
  });
});
