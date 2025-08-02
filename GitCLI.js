import { createInterface } from 'readline';
import Repository from './Repository.js';

export default class GitCLI {
  constructor(rootPath = '/gitTest') {
    this.repository = new Repository(rootPath);
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.isRunning = false;
  }

  /** CLI 시작 */
  start() {
    console.log('Git CLI를 시작합니다. 종료하려면 "git exit" 또는 "git quit"를 입력하세요.\n');
    this.isRunning = true;
    this.getInput();
  }

  /** 사용자 입력 프롬프트 */
  getInput() {
    if (!this.isRunning) {
      this.rl.close();
      return;
    }

    this.rl.question('$ ', (input) => {
      this.processCommand(input.trim());
    });
  }

  /** 명령어 처리 */
  processCommand(input) {
    try {  // 빈 입력 처리
      if (!input) {
        this.getInput();
        return;
      }

      // git으로 시작하지 않는 명령어 처리
      if (!input.startsWith('git ')) {
        console.error('[ERROR] 명령어는 "git "으로 시작해야 합니다.');
        this.getInput();
        return;
      }

      // 'git ' 제거하고 명령어 파싱
      const command = input.slice(4).trim();
      const parts = this.parseCommand(command);

      this.executeCommand(parts);

    } catch (error) {
      console.error(`오류 발생: ${error.message}`);
    }

    // 종료 명령어가 아닌 경우 다음 입력 받기
    if (this.isRunning) {
      this.getInput();
    }
  }

  /** 명령어 파싱 */
  parseCommand(command) {
    // 따옴표를 고려한 파싱
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const char = command[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  /** 명령어 실행 */
  executeCommand(parts) {
    const [command, ...args] = parts;

    switch (command) {
      case 'init':
        this.handleInit();
        break;

      case 'add':
        this.handleAdd(args);
        break;

      case 'commit':
        this.handleCommit(args);
        break;

      case 'branch':
        this.handleBranch(args);
        break;

      case 'switch':
        this.handleSwitch(args);
        break;

      case 'status':
        this.handleStatus();
        break;

      case 'log':
        this.handleLog();
        break;

      case 'exit':
      case 'quit':
        this.handleExit();
        break;

      case 'help':
        this.showHelp();
        break;

      default:
        console.error(`[ERROR] 알 수 없는 명령어: ${command}`);
        console.log('사용 가능한 명령어를 보려면 "git help"를 입력하세요.');
    }
  }

  /** git init 처리 */
  handleInit() {
    console.log('Git 저장소를 초기화합니다...\n');
    this.repository.init();
    console.log('Git 저장소가 초기화되었습니다.\n\n');
  }

  /** git add 처리 */
  handleAdd(args) {
    if (args.length === 0) {
      console.log('사용법: git add <파일경로>');
      return;
    }

    args.forEach(filePath => {
      this.repository.add(filePath);
    });
  }

  /** git commit 처리 */
  handleCommit(args) {
    let message = 'empty commit';
    let author = 'Unknown';
    let email = 'unknown@example.com';

    // 옵션 파싱
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-m' && i + 1 < args.length) {
        message = args[i + 1];
        i++; // 다음 인덱스 스킵
      } else if (args[i] === '--author' && i + 1 < args.length) {
        const authorInfo = args[i + 1];
        const match = authorInfo.match(/^(.+?)\s*<(.+?)>$/);
        if (match) {
          author = match[1].trim();
          email = match[2].trim();
        }
        i++; // 다음 인덱스 스킵
      }
    }

    this.repository.commit(message, author, email);
  }

  /** git branch 처리 */
  handleBranch(args) {
    if (args.length === 0) {
      this.repository.branch(); // 브랜치 목록 출력
    } else {
      const branchName = args[0];
      this.repository.branch(branchName); // 브랜치 생성
    }
  }

  /** git switch 처리 */
  handleSwitch(args) {
    if (args.length === 0) {
      console.log('사용법: git switch <브랜치명>');
      return;
    }

    const branchName = args[0];
    this.repository.switch(branchName);
  }

  /** git status 처리 */
  handleStatus() {
    this.repository.status();
  }

  /** git log 처리 */
  handleLog() {
    this.repository.log();
  }

  /** 종료 처리 */
  handleExit() {
    console.log('Git CLI를 종료합니다.');
    this.isRunning = false;
    this.rl.close();
  }

  /** 도움말 표시 */
  showHelp() {
    console.log(`
사용 가능한 Git 명령어:

  git init                           - Git 저장소 초기화
  git add <파일경로>                  - 파일을 스테이징 영역에 추가
  git commit -m "<메시지>"           - 변경사항 커밋
  git commit -m "<메시지>" --author "이름 <이메일>" - 작성자 정보와 함께 커밋
  git branch                         - 브랜치 목록 보기
  git branch <브랜치명>               - 새 브랜치 생성
  git switch <브랜치명>               - 브랜치 전환
  git status                         - 현재 상태 확인
  git log                           - 커밋 로그 보기
  git help                          - 이 도움말 보기
  git exit 또는 git quit             - CLI 종료

예시:
  $ git init
  $ git add test.txt
  $ git commit -m "첫 번째 커밋"
  $ git branch feature
  $ git switch feature
`);
  }
}