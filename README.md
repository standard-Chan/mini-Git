# JS - Git

JS로 구현한 git입니다.

## 실행
```
node miniGit.js
```
위 명령어 입력시 miniGit이 실행됩니다. git 정보는 `.miniGit` 디렉토리에 저장됩니다.

## 사용 가능 기능

- `init`: 필요한 작업 디렉토리를 생성하고 초기화할 때
- `branch`: 브랜치 목록을 보거나 생성하거나 지울 때
- `add`: 디렉토리의 변경된 파일들을 스테이지(index)에 추가할 때
- `status`: 작업 트리의 상태를 출력할 때
- `commit`: 스테이지 파일들을 커밋으로 기록할 때
- `log`: 커밋 로그를 출력할 때
- `switch`: 브랜치를 이동할 때

### `git help`
```text
사용 가능한 Git 명령어:

  git init                           - Git 저장소 초기화
  git add <파일경로>                  - 파일을 스테이징 영역에 추가
  git commit "<메시지>"           - 변경사항 커밋
  git commit "<메시지>" --author "이름 <이메일>" - 작성자 정보와 함께 커밋
  git branch                         - 브랜치 목록 보기
  git branch <브랜치명>               - 새 브랜치 생성
  git switch <브랜치명>               - 브랜치 전환
  git status                         - 현재 상태 확인
  git log                           - 커밋 로그 보기
  git help                          - 도움말 보기
  git exit 또는 git quit             - CLI 종료

예시:
  $ git init
  $ git add test.txt
  $ git commit "첫 번째 커밋"
  $ git branch feature
  $ git switch feature
```

### 실행 결과
![alt text](image.png)

# 명령어 작동 설명

사용할 수 있는 명령어입니다.

## `init`

```bash
$ git init
```

현재 작업 디렉토리에 `.miniGit` 디렉토리를 생성합니다.

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

### 출력 결과

![alt text](image.png)

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

### 실행결과
![alt text](image-1.png)

## `switch`

```bash
$ git switch <branchName>
```

현재 HEAD를 해당 브랜치를 가리키도록 만듭니다.

#### 내부 로직

현재 `.git/HEAD`에 저장되어있는 값을 이동할 브랜치 이름으로 변경합니다.
만약 `.git/refs/heads` 에 없는 브랜치 이름을 입력할 경우 에러가 발생됩니다.

### 실행 결과
![alt text](image-2.png)

## `add`

```bash
$ git add <filePath>
```

파일을 스태이징 상태로 변환시킵니다.

#### `내부 로직`

해당 파일을 읽고 `SHA-1` 알고리즘으로 해시값을 얻습니다.
이후 `.git/objects/`에 `해시값 첫 2글자` 디렉토리를 생성하여 해당 디렉토리에 파일이름을 `해시값`으로 하여 파일 내용을 저장합니다.
이때 파일 내용은 `zlib`으로 `압축`하여 저장시켰습니다.

추가적으로 스태이징 상태로 만들기 위해서 index 파일에 데이터를 추가합니다.
`<파일모드> <해시값> <파일이름>`를 추가하여 commit 시에 스태이징 파일 정보를 알 수 있게 합니다.

### 실행 결과
![alt text](image-3.png)

## `commit`

```bash
$ git commit
```
스테이징 영역에 있는 파일들을 새로운 Tree 객체에 저장하고 `HEAD` 를 새로운 Commit 객체로 갱신합니다.

#### `내부 로직`

하위 디렉토리부터 root 디렉토리까지 재귀적으로 Tree 객체를 생성합니다.

1. .git/index 파일을 읽어 정보를 파싱

```txt
// .git/index

100644 9872... a/b/test.txt
100644 9872... a/c/test.txt
```

```js
[
  { fileMode: "100644", hash: "9872...", filePath: "a/b/test.txt" },
  { fileMode: "100644", hash: "9872...", filePath: "a/c/test.txt" },
];
```

index파일을 읽어옵니다.

2. 위 배열 자료구조를 `Tree` 자료구조로 변환

```js
{
  root: {
    a: {
      b: {
        'test.txt': {
          fileMode: '100644',
          filename: 'test.txt',
          hash: '9872...'
        }
      },
      c: {
        'test.txt': {
          fileMode: '100644',
          filename: 'test.txt',
          hash: '9872...'
        }
      }
    }
  }
}
```

중첩된 디렉토리 구조로 트리를 표현하고, leaf 노드의 파일인 경우에는 메타정보를 함께 저장합니다.

3. Tree 자료구조를 하위 노드에서부터 읽으면서 Tree 객체를 저장

```js

  root: {
    a: {
      b: {
          'test.txt': {
            fileMode: '100644',
            filename: 'test.txt',
            hash: '9872...'
          },
          content: '100644 test.txt\0<9872...>'
        },
      c: {
          'test.txt': {
            fileMode: '100644',
            filename: 'test.txt',
            hash: '9872...'
          },
          content: '100644 test.txt\0<9872...>'
        }
      }
    }
```
하위 디렉토리부터 읽으면서 content로 직렬화함과 동시에 Tree 객체를 만들어냅니다. 이후 만들어낸 Tree객체의 Hash값을 상위 노드로 전파시킵니다.

위 자료를 예시로 들면, 
1. b를 읽고 test.txt를 직렬화하여 content 생성
2. b의 content를 읽어서 Hash값을 생성하고, zlib으로 압축하여 Tree 객체 생성 및 저장
3. c도 위와 같은 과정을 거침
4. a디렉토리에서 b, c에서 생성한 Hash를 사용하여 content 생성
5. a의 content를 읽어서 Hash를 생성하고 zlib으로 압축한 후 Tree 객체 생성 및 저장
6. root 디렉토리에 a에서 생성한 Hash르르 사용하여 content를 생성
7. root 의 hash를 생성 및 파일 저장

### 실행 결과
![alt text](image-4.png)


## `log`
```bash
$ git log
```
현재의 커밋 객체에 저장되어있는 데이터를 출력합니다.
parent 노드로 이동하면서 이전 커밋 객체 정보까지 모두 출력합니다.

### 실행 결과
![alt text](image-5.png)

---

## 싱글톤 객체

`GitUtil` 클래스를 `싱글톤`으로 생성하였습니다.

- 전역적으로 관리되어 객체를 매번 생성하거나 참조를 넘겨 메서드를 사용하는 불편함을 줄일 수 있습니다.
- 내부 상태 또한 변화하지 않으므로, 테스트시에 문제가 없습니다.

## 경로 객체

`GitPaths` 클래스를 만들어 경로를 공유하도록 설정하였습니다.

- 디렉토리 경로를 `.miniGit`이 아닌 다른 경로로 변경할 시, 해당 클래스의 변수값만 변경하여 처리할 수 있습니다.
- 내부 경로(objects, refs) 또한 간편하게 수정할 수 있습니다.

---

# 트러블 슈팅

## 알고리즘
깊이 우선 탐색으로 JS 객체를 순회할때, 해당 노드의 이름을 모르는 문제가 발생했다.

```js
a : {
  b: {'test.txt' : {fileMode, hash}},
  c: {'test2.txt' : {fileMode, hash}}
}
let cur = a;
```

여기에서 `cur`은 내부 값 b와 c를 가지고 있지만, cur 자체의 이름인 a를 모른다. {b:, c:}에 대한 참조값이 cur에 저장되어있기 때문이다.

```js
  insertContentIntoTree(tree, cur) {

    // 파일인경우
    ...

    for (const child of cur) {
      if (!cur['content']) cur['content'] = '';
      cur['content'].join(this.insertContentIntoTree(tree, cur));
    }
    // 해당 디렉토리 내용을 이용하여 hash 를 생성한다.
    ...

    // Tree 객체를 생성하고 저장한다.
    this.createTreeObject(hash, compressed);
    return `${FILE_MODE.DIR} ${@@@@@}\0${hash}`
  }
```

위 코드 가장 아래에 있는 `${@@@@@}` 에 현재 cur에 해당하는 디렉토리 이름을 넣어야한다. 하지만 cur은 현재 이름 정보를 가지고 있지 않다.
따라서 재귀로 순회할 때 현재 `cur`의 정보를 반환하는게 아니라, 한칸 아래의 `child`정보를 반환해야한다.

아래와 같이 `child 정보`를 반환하도록 수정하였다.

```js
  // 기존 코드

  /** Tree 자료구조를 leaf 노드에서부터 올라오면서 Tree 의 content를 채운다.
   * @param {*} cur 현재 노드
  */
  insertContentIntoTree(cur) {

    if (cur.fileMode && cur.hash) { // 파일인경우
      return `${FILE_MODE.REGULAR} ${cur.filename}\0${cur.hash}`;
    }
    for (const child in cur) {
      if (!cur.child['content']) cur['content'] = '';
      cur['content'].join(this.insertContentIntoTree(cur[child]));
    }

    // 해당 디렉토리 내용을 이용하여 hash 를 생성한다.
    const hash = this.gitUtil.getSha1Hash(cur['content']);
    const compressed = this.gitUtil.compress(cur['content']);
    console.log(`콘텐츠 : ${cur['content']}`);


    // Tree 객체를 생성하고 저장한다.
    this.createTreeObject(hash, compressed);
    return `${FILE_MODE.DIR} \0${hash}`
  }

  createTreeObject(hash, content) {
    this.saveTreeObject(hash, content);
  }
```

```js
// 수정한 코드

  /** Tree 자료구조를 leaf 노드에서부터 올라오면서 Tree 의 content를 채운다.
   * @param {*} cur 현재 노드
  */
  buildTree(cur) {
    (!cur.content) ? cur.content = '' : cur.content += ('\n'); // 없으면 만들고 있으면 한줄 띄우기

    // 자식 순회
    for (const child in cur) {
      if (child == 'content') continue;

      const childNode = cur[child];
      if (childNode.fileMode && childNode.hash) { // 파일인 경우
        cur.content += (`${FILE_MODE.REGULAR} ${childNode.filename}\0${childNode.hash}`);
      }
      else { // 디렉토리인 경우
        const hash = this.buildTree(childNode); // 하위 노드 먼저 방문하여 content 채우기
        cur['content'] += (`${FILE_MODE.DIR} ${child}\0${hash}`);
      }
    }

    const hash = this.createTreeObject(cur.content);

    return hash;
  }
```