# JS - Git

JS로 구현한 git입니다.

## 사용 가능 기능

- `init`: 필요한 작업 디렉토리를 생성하고 초기화할 때
- `branch`: 브랜치 목록을 보거나 생성하거나 지울 때
- `add`: 디렉토리의 변경된 파일들을 스테이지(index)에 추가할 때
- `status`: 작업 트리의 상태를 출력할 때
- ~`commit`: 스테이지 파일들을 커밋으로 기록할 때~ => 미구현
- ~`log`: 커밋 로그를 출력할 때~ => 미구현
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

#### 내부 로직

현재 `.git/HEAD`에 저장되어있는 값을 이동할 브랜치 이름으로 변경합니다.
만약 `.git/refs/heads` 에 없는 브랜치 이름을 입력할 경우 에러가 발생됩니다.

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

## `commit`

### `내부 로직`
구현이 상당히 어려웠다. 하위 디렉토리부터 생성해야하는 부분이 어려웠는데 구체적인 예시를 통해 이해해보자.

다음 파일들을 add하여 staging 시켰다고 가정해 봅니다.

```js
'a/b/c/test.txt'
'a/b/c/a.txt'
'a/b/k/b.txt'
```

이때, Tree 객체를 만드는 순서는 반드시 하위 디렉토리부터 처리되어야하므로,
 a/b/c -> a/b/k -> a/b -> a 순으로 처리되어야합니다.

즉 다음 순서로 처리되어야합니다.

```js
'a/b/c'
'a/b/c/test.txt'
'a/b/c/a.txt'
'a/b/k'
'a/b/k/b.txt'
'a/b'
'a'
```

**브루트포스 방식을 사용하여 Tree 객체를 하위 디렉토리 순으로 생성시켰습니다.**

```js
// 1. a/b/c/test.txt 를 '/'기준으로 파싱한다
parsed = [a, b, c, test.txt];

// 2. 파싱된 배열을 순회하면서 다음 구조를 만든다.
path = [a, a/b, a/b/c, a/b/c/test.txt];

// 3. 각 요소를 읽으면서 저장시킨다. 마지막 값을 이전 값의 데이터로 넣는다.
{
  'a' : {b},
  'a/b' : {c},
  'a/b/c' : {fileMode:100644, filePath: 'test.txt', 해시값}
}

// 4. 스테이징된 모든 데이터에 대해서 위 과정을 반복한다. 그러면 아래와 같은 데이터를 얻을 수 있다.

{
  'a' : {b},
  'a/b' : {c, k},
  'a/b/c' : {test.txt, a.txt},
  'a/b/k' : {b.txt}
}

// 5. 역순으로 정렬 시킨다.

{
  'a/b/k' : {b.txt},
  'a/b/c' : {test.txt, a.txt},
  'a/b' : {c, k},
  'a' : {b}
}

// 6. 위에서부터 차례대로 읽으면서 Tree 객체를 생성한다.
```

# 출력

```js
repo.init();

repo.branch();
repo.branch('새로운 브랜치!');
repo.branch();
repo.switch('master');
repo.add('test.txt');
repo.status();
```

input을 받는 모듈을 구현하지 못해서 코드로 출력한 결과입니다.

![출력](https://private-user-images.githubusercontent.com/95221819/472631919-5c36467a-b99d-4114-ab06-acce4fddd9b5.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTM4OTY3ODEsIm5iZiI6MTc1Mzg5NjQ4MSwicGF0aCI6Ii85NTIyMTgxOS80NzI2MzE5MTktNWMzNjQ2N2EtYjk5ZC00MTE0LWFiMDYtYWNjZTRmZGRkOWI1LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTA3MzAlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwNzMwVDE3MjgwMVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWMxMGM2Njc1NTQxNmExNmVmNmMyNzg3MDJkNTU1MTQ0ZmRjYjFiMDczNjkyMzYwNDMzNzFiODU0ZWEyMmQ4NWEmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.VBdB_PYwcx0zqjaYDCXHZOx5Smma4VGF3UdcoXqm0UQ)


# 기타

## 싱글톤 객체

`GitUtil` 클래스를 `싱글톤`으로 생성하였습니다.

- 전역적으로 관리되어 객체를 매번 생성하거나 참조를 넘겨 메서드를 사용하는 불편함을 줄일 수 있습니다.
- 내부 상태 또한 변화하지 않으므로, 테스트시에 문제가 없습니다.
