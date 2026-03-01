// =============================================
// 가라온브로스 — 게임 데이터
// 새 게임 추가: 배열에 객체 하나 추가하면 끝!
// =============================================

const BOARD_GAMES = [
  {
    id: 1, name: '블로커스', name_en: 'Blokus',
    min_players: 2, max_players: 4, play_time_min: 30,
    difficulty: 2, fun_score: 4,
    categories: ['전략', '공간'], age_min: 7,
    description: '색깔 블록을 최대한 많이 보드에 올려놓는 공간 전략 게임',
    rules: '1. 각 21개 블록 보유\n2. 첫 블록은 자기 코너에 닿아야 함\n3. 이후 블록은 꼭짓점에만 접촉 가능 (변 접촉 금지)\n4. 더 이상 놓을 수 없으면 종료\n5. 남은 블록 칸수가 적을수록 승리',
    tips: '코너를 먼저 확보하고 상대 진출을 막는 게 핵심!'
  },
  {
    id: 2, name: '루미큐브', name_en: 'Rummikub',
    min_players: 2, max_players: 4, play_time_min: 45,
    difficulty: 2, fun_score: 4,
    categories: ['숫자', '카드', '전략'], age_min: 8,
    description: '숫자 타일로 세트를 만들어 먼저 다 내려놓는 게임',
    rules: '1. 타일 14개로 시작\n2. 같은 숫자 다른 색 3-4개 OR 같은 색 연속 숫자 3개+\n3. 첫 출전 합계 30점 이상\n4. 상대 세트 재배열 가능\n5. 먼저 타일 다 내면 승리',
    tips: '상대 세트 분해해서 내 타일 끼워넣기가 핵심!'
  },
  {
    id: 3, name: '할리갈리', name_en: 'Halli Galli',
    min_players: 2, max_players: 6, play_time_min: 20,
    difficulty: 1, fun_score: 5,
    categories: ['파티', '반응속도', '카드'], age_min: 6,
    description: '같은 과일이 정확히 5개가 되면 가장 먼저 종을 치는 게임',
    rules: '1. 카드를 균등 분배\n2. 순서대로 한 장씩 뒤집기\n3. 같은 과일 합이 정확히 5개면 종치기\n4. 가장 먼저 친 사람이 카드 전부 가져감\n5. 카드 가장 많으면 승리',
    tips: '정확히 5개여야 함. 4개나 6개면 패널티!'
  },
  {
    id: 4, name: '코드네임', name_en: 'Codenames',
    min_players: 4, max_players: 8, play_time_min: 20,
    difficulty: 2, fun_score: 5,
    categories: ['추리', '언어', '팀전'], age_min: 10,
    description: '스파이마스터 한 단어 힌트로 팀원들이 올바른 카드를 찾는 게임',
    rules: '1. 두 팀 구성 후 스파이마스터 선출\n2. 5x5 단어 카드 배열\n3. 스파이마스터: 단어 하나+숫자로 힌트\n4. 팀원이 해당 카드 지목\n5. 자기 팀 카드 먼저 찾으면 승리',
    tips: '힌트 하나로 여러 카드 연결할수록 유리!'
  },
  {
    id: 5, name: '젠가', name_en: 'Jenga',
    min_players: 2, max_players: 99, play_time_min: 20,
    difficulty: 1, fun_score: 5,
    categories: ['파티', '긴장감', '순발력'], age_min: 6,
    description: '블록을 빼서 맨 위에 올리는 균형 게임. 탑이 무너지면 패배!',
    rules: '1. 54개 블록을 3개씩 쌓아 탑 완성\n2. 한 손으로 블록 하나 빼서 맨 위에 올리기\n3. 탑 무너뜨린 사람이 패배\n4. 맨 위 3층은 건드릴 수 없음',
    tips: '가운데보다 양쪽 끝 블록이 빼기 더 쉬워요!'
  },
  {
    id: 6, name: '우노', name_en: 'UNO',
    min_players: 2, max_players: 10, play_time_min: 30,
    difficulty: 1, fun_score: 5,
    categories: ['카드', '파티'], age_min: 6,
    description: '같은 색 or 숫자 카드를 내고 마지막에 우노를 외치는 게임',
    rules: '1. 7장씩 배분\n2. 같은 색 or 숫자 or 특수카드 내기\n3. 카드 1장 남으면 우노 외치기\n4. 외치지 않으면 2장 추가\n5. 카드 먼저 다 내면 승리',
    tips: '+4 카드는 최후 수단으로 아껴두기!'
  },
  {
    id: 7, name: '도블', name_en: 'Dobble',
    min_players: 2, max_players: 8, play_time_min: 15,
    difficulty: 1, fun_score: 5,
    categories: ['파티', '반응속도', '관찰력'], age_min: 6,
    description: '어떤 두 카드에도 공통 그림이 딱 1개. 먼저 찾으면 승리!',
    rules: '1. 각 카드에 그림 8개\n2. 어느 두 카드든 공통 그림 정확히 1개\n3. 공통 그림 먼저 외치면 그 카드 획득',
    tips: '그림 하나만 집중해서 찾아보세요!'
  },
  {
    id: 8, name: '딕싯', name_en: 'Dixit',
    min_players: 3, max_players: 6, play_time_min: 30,
    difficulty: 1, fun_score: 5,
    categories: ['파티', '창의', '추리'], age_min: 8,
    description: '아름다운 그림 카드로 힌트를 내고 맞히는 창의력 게임',
    rules: '1. 6장씩 배분\n2. 이야기꾼이 카드 보고 힌트 냄\n3. 나머지가 비슷한 카드 제출\n4. 섞어서 공개, 이야기꾼 카드에 투표\n5. 전부 맞추거나 전부 틀리면 이야기꾼 0점',
    tips: '일부만 맞힐 수 있는 애매한 힌트가 최고!'
  },
  {
    id: 9, name: '팬데믹', name_en: 'Pandemic',
    min_players: 2, max_players: 4, play_time_min: 60,
    difficulty: 3, fun_score: 4,
    categories: ['협력', '전략'], age_min: 10,
    description: '모두가 협력해 전 세계 전염병을 막는 협동 게임',
    rules: '1. 전원 협력해 4가지 질병 퇴치하면 승리\n2. 각자 역할 특수 능력 활용\n3. 매 턴 질병 확산\n4. 아웃브레이크 8회 or 카드 소진 시 패배',
    tips: '매 턴 목표 공유하며 소통이 핵심!'
  },
  {
    id: 10, name: '스플렌더', name_en: 'Splendor',
    min_players: 2, max_players: 4, play_time_min: 30,
    difficulty: 2, fun_score: 4,
    categories: ['전략', '경제'], age_min: 10,
    description: '보석으로 카드를 사고 귀족을 유치해 15점 먼저 달성하는 게임',
    rules: '1. 보석 토큰 가져오거나 개발 카드 구입\n2. 개발 카드 = 영구 보석\n3. 귀족: 특정 카드 조합 달성 시 자동 방문\n4. 15점 달성 후 최고 점수 승리',
    tips: '영구 보석 카드 빠르게 확보가 핵심!'
  },
  {
    id: 11, name: '텔레스트레이션', name_en: 'Telestrations',
    min_players: 4, max_players: 8, play_time_min: 30,
    difficulty: 1, fun_score: 5,
    categories: ['파티', '그림', '창의'], age_min: 8,
    description: '그림이 전달되면서 내용이 엉뚱하게 바뀌는 재미있는 게임',
    rules: '1. 단어 선택 후 그림으로 표현\n2. 다음 사람이 그림 보고 단어 추측\n3. 단어 보고 다시 그림 그리기 반복\n4. 마지막에 전달 흐름 공개',
    tips: '이기는 게 목표가 아니라 망가진 과정이 제일 재미!'
  },
  {
    id: 12, name: '마피아게임', name_en: 'Mafia',
    min_players: 6, max_players: 12, play_time_min: 30,
    difficulty: 2, fun_score: 5,
    categories: ['추리', '파티', '팀전'], age_min: 10,
    description: '마피아 vs 시민, 밤낮으로 진행하는 심리 추리 게임',
    rules: '1. 진행자가 역할 배분 (마피아/경찰/의사/시민)\n2. 밤: 마피아 지목, 경찰 수사, 의사 치료\n3. 낮: 토론 후 투표로 처형\n4. 마피아 전원 제거시 시민 승리',
    tips: '마피아는 낮에 최대한 의심받지 않는 게 핵심!'
  },
  {
    id: 13, name: '클루', name_en: 'Cluedo',
    min_players: 3, max_players: 6, play_time_min: 45,
    difficulty: 2, fun_score: 4,
    categories: ['추리', '전략'], age_min: 8,
    description: '누가 어디서 무엇으로 살인했는지 추리하는 게임',
    rules: '1. 범인/장소/무기 카드 각 1장씩 봉투에 비밀 보관\n2. 나머지 카드 배분\n3. 이동 후 추리 선언\n4. 확신하면 최종 추리 선언\n5. 틀리면 탈락',
    tips: '메모장 필수! 없다고 확인된 카드부터 지워가기'
  },
  {
    id: 14, name: '픽셔너리', name_en: 'Pictionary',
    min_players: 4, max_players: 8, play_time_min: 30,
    difficulty: 1, fun_score: 5,
    categories: ['파티', '그림', '팀전'], age_min: 8,
    description: '그림을 그려 팀원이 60초 안에 단어를 맞히는 게임',
    rules: '1. 두 팀으로 나눔\n2. 그림으로만 표현 (말 금지)\n3. 팀원이 60초 안에 단어 맞히기\n4. 결승점 먼저 도달한 팀 승리',
    tips: '사람/동물/행동 순으로 힌트 주기!'
  },
  {
    id: 15, name: '로보77', name_en: 'Robot 77',
    min_players: 3, max_players: 8, play_time_min: 20,
    difficulty: 1, fun_score: 4,
    categories: ['카드', '파티', '숫자'], age_min: 8,
    description: '카드 숫자 합이 77을 넘지 않도록 내는 게임. 넘기면 탈락!',
    rules: '1. 각 4장씩 배분\n2. 순서대로 카드 내며 합계 77 미만 유지\n3. 77 이상 되면 칩 하나 잃음\n4. 칩 3개 소진 시 탈락\n5. 마지막 1명 승리',
    tips: '-10, 77고정 카드는 아껴두는 게 생존 비결!'
  },
  {
    id: 16, name: '쿠', name_en: 'Coup',
    min_players: 2, max_players: 6, play_time_min: 15,
    difficulty: 2, fun_score: 5,
    categories: ['추리', '파티', '블러핑'], age_min: 10,
    description: '상대 패를 알아내고 탈락시키는 블러핑 심리 게임',
    rules: '1. 역할 카드 2장 받기 (비공개)\n2. 역할에 맞는 행동 or 블러핑\n3. 도전하면 카드 공개\n4. 블러핑 실패시 카드 1장 탈락\n5. 카드 2장 잃으면 아웃\n6. 마지막 1명 승리',
    tips: '자신있게 블러핑! 표정 관리가 전부'
  },
  {
    id: 17, name: '카르카손', name_en: 'Carcassonne',
    min_players: 2, max_players: 5, play_time_min: 45,
    difficulty: 2, fun_score: 4,
    categories: ['전략', '타일'], age_min: 8,
    description: '타일을 놓아 지형을 만들고 미플을 배치해 점수를 얻는 게임',
    rules: '1. 타일 뽑아 기존 타일에 맞게 배치\n2. 미플을 도시/길/수도원/농지에 배치\n3. 완성된 구조물에서 점수 획득\n4. 타일 소진 후 최고 점수 승리',
    tips: '농지 점수는 후반 폭발! 미리 선점하세요'
  },
  {
    id: 18, name: '고스트블리츠', name_en: 'Ghost Blitz',
    min_players: 2, max_players: 8, play_time_min: 20,
    difficulty: 2, fun_score: 5,
    categories: ['파티', '반응속도', '관찰력'], age_min: 8,
    description: '카드를 보고 규칙에 맞는 물건을 가장 먼저 잡는 반응 게임',
    rules: '1. 카드 공개\n2. 카드에 정확히 그 색상+물건 있으면 해당 물건 잡기\n3. 아무것도 정확히 없으면 색도 물건도 안 나온 것 잡기\n4. 틀리면 카드 반납\n5. 카드 가장 많은 사람 승리',
    tips: '규칙이 처음엔 헷갈림. 2-3번 연습 라운드 추천!'
  },
  {
    id: 19, name: '텀블링몽키', name_en: 'Tumbling Monkeys',
    min_players: 2, max_players: 6, play_time_min: 15,
    difficulty: 1, fun_score: 4,
    categories: ['파티', '긴장감'], age_min: 5,
    description: '막대기를 빼내어 원숭이를 떨어뜨리지 않는 균형 게임',
    rules: '1. 통에 막대기 꽂고 원숭이 넣기\n2. 주사위 굴려 해당 색 막대기 제거\n3. 원숭이 가장 많이 떨어뜨린 사람 패배',
    tips: '막대 빼기 전에 위 원숭이 무게 분산 확인!'
  },
  {
    id: 20, name: '방탈출카드게임', name_en: 'Escape Room',
    min_players: 2, max_players: 5, play_time_min: 60,
    difficulty: 3, fun_score: 4,
    categories: ['협력', '퍼즐', '추리'], age_min: 12,
    description: '60분 안에 카드 퍼즐을 풀고 방을 탈출하는 협력 게임',
    rules: '1. 60분 타이머 시작\n2. 카드 힌트/수수께끼 풀어 해독기에 입력\n3. 틀리면 15분 패널티\n4. 60분 안에 모든 퍼즐 풀기',
    tips: '분업보다 같이 보고 토론하는 게 더 빠름!'
  },
];

// =============================================
// 맨손 게임 데이터
// =============================================

const HAND_GAMES = [
  {
    id: 101, name: '금지어 게임',
    min_players: 4, max_players: 99, play_time_min: 15, fun_score: 5,
    categories: ['언어', '시끌벅적', '팀전'], age_min: 8,
    description: '팀원에게 금지어 없이 단어를 설명하고 맞히는 게임',
    rules: '1. 두 팀으로 나눔\n2. 설명자는 금지어 없이 설명\n3. 팀원이 60초 안에 맞히면 1점\n4. 금지어 말하면 0점\n5. 많이 맞힌 팀 승리',
    tips: '몸짓도 활용 가능!', materials: '없음'
  },
  {
    id: 102, name: '영어금지 게임',
    min_players: 3, max_players: 20, play_time_min: 30, fun_score: 4,
    categories: ['언어', '조용', '집중'], age_min: 8,
    description: '일상 대화에서 영어 외래어를 쓰면 패널티. 끝까지 살아남기!',
    rules: '1. 시작 선언 후 영어 외래어 금지\n2. 사용 시 오답 스티커 or 미션 부여\n3. 정해진 시간 후 가장 적게 걸린 사람 승리',
    tips: '예외 없이 엄격하게 적용할수록 재미 UP!', materials: '없음'
  },
  {
    id: 103, name: '369 게임',
    min_players: 3, max_players: 30, play_time_min: 10, fun_score: 4,
    categories: ['숫자', '시끌벅적', '반응속도'], age_min: 6,
    description: '순서대로 숫자를 세되 3·6·9가 들어가면 박수!',
    rules: '1. 원형으로 앉기\n2. 1씩 증가하며 숫자 말하기\n3. 3·6·9 포함 숫자는 그 횟수만큼 박수\n4. 틀리면 탈락 or 벌칙',
    tips: '33은 박수 2번! 헷갈리는 구간 주의', materials: '없음'
  },
  {
    id: 104, name: '마피아 게임',
    min_players: 6, max_players: 20, play_time_min: 30, fun_score: 5,
    categories: ['추리', '시끌벅적', '팀전'], age_min: 10,
    description: '마피아 vs 시민으로 나뉘어 밤낮으로 진행하는 심리 추리 게임',
    rules: '1. 진행자가 역할 부여\n2. 밤: 눈 감고 마피아 지목\n3. 낮: 토론 및 투표로 처형\n4. 마피아 전원 제거시 시민 승리',
    tips: '진행자가 중요! 페이즈 시간 엄수하기', materials: '역할 종이 or 앱'
  },
  {
    id: 105, name: '몸으로 말해요',
    min_players: 4, max_players: 20, play_time_min: 20, fun_score: 5,
    categories: ['신체', '시끌벅적', '팀전'], age_min: 6,
    description: '몸짓/표정으로만 단어를 표현하고 팀원이 맞히는 게임',
    rules: '1. 두 팀으로 나눔\n2. 말하지 않고 몸으로만 표현\n3. 팀원이 60초 안에 맞히면 1점\n4. 패스 1회 허용\n5. 많이 맞힌 팀 승리',
    tips: '단어 주제 미리 정하면 더 재미있어요!', materials: '없음'
  },
  {
    id: 106, name: '스피드 퀴즈',
    min_players: 4, max_players: 20, play_time_min: 15, fun_score: 5,
    categories: ['언어', '시끌벅적', '반응속도'], age_min: 8,
    description: '이마에 폰을 대고 팀원 힌트로 단어를 맞히는 게임',
    rules: '1. 폰 앱 or 카드 사용\n2. 이마에 올리고 팀원 힌트 듣기\n3. 60초 안에 최대한 많이 맞히기\n4. 많이 맞힌 팀 승리',
    tips: '폰 앱 스피드 퀴즈 활용하면 편리!', materials: '스마트폰'
  },
  {
    id: 107, name: '공통점 찾기',
    min_players: 3, max_players: 10, play_time_min: 10, fun_score: 4,
    categories: ['창의', '조용', '두뇌'], age_min: 10,
    description: '전혀 다른 두 단어의 공통점을 말하는 게임',
    rules: '1. 진행자가 단어 두 개 제시\n2. 돌아가며 공통점 말하기\n3. 말문 막히거나 중복이면 탈락',
    tips: '창의적인 답일수록 웃음 보장! 판정은 다수결', materials: '없음'
  },
  {
    id: 108, name: '눈치게임',
    min_players: 5, max_players: 30, play_time_min: 5, fun_score: 4,
    categories: ['신체', '반응속도'], age_min: 6,
    description: '번호를 부르며 일어서되 동시에 일어나면 탈락!',
    rules: '1. 모두 앉아서 시작\n2. 아무 때나 일어나며 숫자 외침\n3. 동시에 같은 숫자 외치면 두 명 탈락\n4. 전체 인원 숫자까지 성공하면 클리어',
    tips: '눈치를 잘 봐야! 잠깐의 침묵이 타이밍', materials: '없음'
  },
  {
    id: 109, name: '초성 게임',
    min_players: 3, max_players: 20, play_time_min: 15, fun_score: 4,
    categories: ['언어', '두뇌', '반응속도'], age_min: 8,
    description: '주제에 맞는 단어를 초성으로만 외치는 게임',
    rules: '1. 주제+초성 제시 (예: 음식 + ㄱㄱ)\n2. 해당 단어 먼저 외친 사람이 1점\n3. 말문 막히거나 틀리면 다음 사람',
    tips: '아는 단어도 초성 조합이 어려울 수 있어요', materials: '없음'
  },
  {
    id: 110, name: '텔레파시 게임',
    min_players: 4, max_players: 20, play_time_min: 15, fun_score: 5,
    categories: ['창의', '팀전'], age_min: 8,
    description: '아무 소통 없이 팀원들이 같은 단어를 쓰면 성공!',
    rules: '1. 주제 제시\n2. 팀원 모두 소통 없이 종이에 단어 적기\n3. 공개 후 같은 단어 있으면 성공!\n4. 더 많이 겹친 팀 승리',
    tips: '가장 일반적인 단어 쓰는 게 전략!', materials: '종이, 펜'
  },
];

// 필터용 카테고리 목록
const BG_CATEGORIES = ['전략','카드','파티','협력','추리','경제','타일','그림','숫자','공간','블러핑','팀전','반응속도','창의','긴장감','관찰력'];
const HG_CATEGORIES = ['언어','신체','추리','창의','두뇌','반응속도','시끌벅적','조용','팀전','숫자','집중'];
