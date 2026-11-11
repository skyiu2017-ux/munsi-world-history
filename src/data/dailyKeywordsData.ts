export interface DailyKeywordQuiz {
  id: string;
  keyword: string;
  era: string;
  chapterTitle: string;
  hint: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  funFact: string;
}

// 미래엔 역사① 교과서 기반: 교과서 밖 세부 일화·과도한 단정 정리
export const DAILY_KEYWORDS_DATA: DailyKeywordQuiz[] = [
  {
    id: "dk-1",
    keyword: "카노사의 굴욕",
    era: "중세 서유럽",
    chapterTitle: "크리스트교와 교황권",
    hint: "교황과 황제가 성직자 임명권을 두고 다투었습니다.",
    question: "성직자 임명권을 둘러싼 갈등 끝에 신성 로마 제국 황제가 교황에게 용서를 구한 사건은?",
    options: ["십자군 원정", "카노사의 굴욕", "아비뇽 유수", "베스트팔렌 조약"],
    correctIndex: 1,
    explanation: "교황 그레고리우스 7세와 황제 하인리히 4세 사이의 갈등에서 황제가 교황에게 용서를 구한 사건이 카노사의 굴욕입니다.",
    funFact: "이 사건은 중세 서유럽에서 교황의 권위가 높아진 모습을 보여 줍니다.",
  },
  {
    id: "dk-2",
    keyword: "도편 추방제",
    era: "고대 그리스",
    chapterTitle: "그리스 & 헬레니즘",
    hint: "참주가 등장하는 것을 막으려 했습니다.",
    question: "고대 아테네에서 참주가 될 위험이 있는 사람의 이름을 도자기 조각에 적어 추방하던 제도는?",
    options: ["호민관 제도", "도편 추방제", "군현제", "봉건제"],
    correctIndex: 1,
    explanation: "아테네의 클레이스테네스는 참주의 출현을 막기 위해 도편 추방제를 마련했습니다.",
    funFact: "도편 추방제는 고대 아테네의 민주 정치 발전 과정에서 등장했습니다.",
  },
  {
    id: "dk-3",
    keyword: "함무라비 법전",
    era: "고대 메소포타미아",
    chapterTitle: "4대 문명",
    hint: "같은 범죄라도 사람의 신분에 따라 처벌이 달랐습니다.",
    question: "고대 바빌로니아의 왕이 편찬한 법전으로, 신분에 따른 차등 처벌이 나타나는 것은?",
    options: ["12표법", "함무라비 법전", "나폴레옹 법전", "로마법 대전"],
    correctIndex: 1,
    explanation: "바빌로니아의 함무라비왕이 편찬한 함무라비 법전에는 신분에 따라 처벌이 달라지는 규정이 담겨 있습니다.",
    funFact: "미래엔 교과서에는 귀족과 평민에게 서로 다른 처벌을 적용하는 법 조항이 실려 있습니다.",
  },
  {
    id: "dk-4",
    keyword: "프랑스 혁명 전 신분제의 모순",
    era: "프랑스 혁명",
    chapterTitle: "프랑스 혁명",
    hint: "일부 신분은 특권을 누리고 대다수는 세금 부담이 컸습니다.",
    question: "프랑스 혁명 이전 제3 신분이 불만을 느낀 이유로 가장 적절한 것은?",
    options: ["제3 신분이 모든 고위 관직을 독점했다.", "제3 신분만 모든 세금을 면제받았다.", "특권 신분과 달리 제3 신분은 무거운 세금을 부담했다.", "프랑스에서는 신분 구분이 전혀 없었다."],
    correctIndex: 2,
    explanation: "혁명 이전 제1·2 신분은 특권을 누렸지만 다수의 제3 신분은 무거운 세금을 부담하고 정치 참여에도 제한을 받았습니다.",
    funFact: "교과서의 혁명 전 신분제 사회 풍자화를 보면 제3 신분의 부담을 짐작할 수 있습니다.",
  },
  {
    id: "dk-5",
    keyword: "95개조 반박문",
    era: "유럽의 종교 개혁",
    chapterTitle: "종교개혁",
    hint: "면벌부 판매를 비판하며 종교 개혁을 촉발했습니다.",
    question: "1517년 95개조 반박문을 발표하여 면벌부 판매를 비판한 인물은?",
    options: ["장 칼뱅", "마르틴 루터", "헨리 8세", "카롤루스 대제"],
    correctIndex: 1,
    explanation: "루터는 교황의 면벌부 판매를 비판하며 95개조 반박문을 발표했습니다.",
    funFact: "인쇄술의 확산은 종교 개혁의 주장이 널리 퍼지는 데 영향을 주었습니다.",
  },
  {
    id: "dk-6",
    keyword: "파쇼다 사건",
    era: "제국주의 열강의 침략",
    chapterTitle: "제국주의",
    hint: "영국의 아프리카 종단 정책과 프랑스의 횡단 정책이 충돌했습니다.",
    question: "영국과 프랑스가 아프리카에서 식민지 확대를 놓고 충돌한 사건은?",
    options: ["카노사의 굴욕", "파쇼다 사건", "포에니 전쟁", "명예혁명"],
    correctIndex: 1,
    explanation: "영국은 남북 방향의 종단 정책을, 프랑스는 동서 방향의 횡단 정책을 추진하다 수단의 파쇼다에서 충돌했습니다.",
    funFact: "교과서 지도에서 영국과 프랑스의 진출 방향이 만나는 지점을 확인할 수 있습니다.",
  },
  {
    id: "dk-7",
    keyword: "베스트팔렌 조약",
    era: "유럽의 종교 전쟁",
    chapterTitle: "종교개혁",
    hint: "30년 전쟁을 끝내고 칼뱅파를 공식 인정했습니다.",
    question: "30년 전쟁을 끝내면서 칼뱅파도 공식적으로 인정한 조약은?",
    options: ["베르됭 조약", "아우크스부르크 화의", "베스트팔렌 조약", "밀라노 칙령"],
    correctIndex: 2,
    explanation: "베스트팔렌 조약(1648)은 30년 전쟁을 끝낸 평화 조약으로, 가톨릭과 루터파에 더해 칼뱅파의 지위도 인정했습니다.",
    funFact: "앞서 아우크스부르크 화의(1555)에서 인정된 신교는 루터파였습니다.",
  },
  {
    id: "dk-8",
    keyword: "왕권신수설과 관료제",
    era: "근대 유럽 절대 왕정",
    chapterTitle: "절대 왕정",
    hint: "왕의 권력은 신이 준 것이라며 관료제와 상비군을 육성했습니다.",
    question: "16~18세기 유럽 절대 군주가 자신의 권력을 정당화하기 위해 내세운 통치 이념은?",
    options: ["왕권신수설", "사회 진화론", "천명사상", "선민사상"],
    correctIndex: 0,
    explanation: "절대 왕정의 군주들은 왕의 권력이 신에게서 직접 부여되었다는 왕권신수설을 바탕으로 관료제와 상비군을 통솔하며 강력한 권력을 행사했습니다.",
    funFact: "프랑스의 루이 14세는 베르사유 궁전을 짓고 '짐은 곧 국가다'라는 말을 남겨 절대 왕정의 전형을 보여 주었습니다.",
  },
];

export const getDailyQuizForToday = (): DailyKeywordQuiz => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return DAILY_KEYWORDS_DATA[dayOfYear % DAILY_KEYWORDS_DATA.length];
};
