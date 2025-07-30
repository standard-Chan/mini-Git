# JS - Git

JS로 구현한 git입니다.

## 사용 가능 기능

- `init`: 필요한 작업 디렉토리를 생성하고 초기화할 때
- `branch`: 브랜치 목록을 보거나 생성하거나 지울 때
- `add`: 디렉토리의 변경된 파일들을 스테이지(index)에 추가할 때
- `status`: 작업 트리의 상태를 출력할 때
- `commit`: 스테이지 파일들을 커밋으로 기록할 때
- `log`: 커밋 로그를 출력할 때
- `switch`: 브랜치를 이동할 때

# 명령어 작동 방식

사용할 수 있는 명령어입니다.

## `init`

```bash
$ git init
```

현재 작업 디렉토리에 `.git` 디렉토리를 생성합니다.

```scss
.git/
├── objects/
│   ├── <blob> (파일 내용)
│   ├── <tree> (디렉토리 구조)
│   └── <commit> (스냅샷의 포인터)
├── index
├── refs/heads/
└── HEAD
```

생성되는 디렉토리/파일은 다음 구조입니다.

각 디렉토리 및 파일은 다음 정보를 저장합니다.

- `objects` : blob, tree, commit 객체의 파일들을 저장할 디렉토리
- `index` : staging 파일들을 저장해 놓은 파일
- `refs/heads/` : 각 브랜치가 가리키고 있는 커밋 정보를 저장하는 디렉토리
- `HEAD` : 현재 HEAD가 위치한 브랜치 정보

## `branch`

```bash
$ git branch
```

현재 브랜치 목록을 출력합니다.

`.git/refs/heads` 에 저장되어있는 브랜치 파일 이름들을 읽고 출력합니다.

```bash
$ git branch <branch name>
```

새로운 브랜치를 생성합니다.

`.git/refs/heads` 에 새로 생성할 브랜치 파일을 생성합니다.


## `switch`

```bash
$ git switch <branchName>
```

현재 HEAD를 해당 브랜치를 가리키도록 만듭니다.

현재 `.git/HEAD`에 저장되어있는 값을 이동할 브랜치 이름으로 변경합니다.
만약 `.git/refs/heads` 에 없는 브랜치 이름을 입력할 경우 에러가 발생됩니다.
