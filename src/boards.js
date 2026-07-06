/**
 * Vindt Shop - Community Boards Data
 * Includes: Notices, Reviews, Q&A
 */

// NOTICE BOARD DATA
const NOTICES = [
    {
        id: 1,
        title: "2026년 2월 정기 배송 휴무 안내",
        content: "설 연휴 기간 동안 배송이 지연될 수 있습니다. 양해 부탁드립니다.",
        date: "2026-02-01",
        views: 245,
        pinned: true,
        author: "Vindt Shop"
    },
    {
        id: 2,
        title: "신규 회원 가입 시 3,000P 적립 이벤트",
        content: "2월 한 달간 신규 회원 가입하시는 분들께 3,000 포인트를 드립니다!",
        date: "2026-02-01",
        views: 892,
        pinned: true,
        author: "Vindt Shop"
    },
    {
        id: 3,
        title: "95% SALE 카테고리 오픈",
        content: "초특가 할인 상품들을 모아둔 95% SALE 카테고리가 새롭게 오픈했습니다.",
        date: "2026-01-28",
        views: 1234,
        pinned: false,
        author: "Vindt Shop"
    },
    {
        id: 4,
        title: "교환/반품 정책 변경 안내",
        content: "2026년 2월 1일부터 교환/반품 정책이 일부 변경됩니다. 자세한 내용은 본문을 확인해주세요.",
        date: "2026-01-25",
        views: 567,
        pinned: false,
        author: "Vindt Shop"
    },
    {
        id: 5,
        title: "해외 배송 서비스 개시",
        content: "이제 전 세계 어디서나 Vindt Shop의 빈티지 제품을 만나보실 수 있습니다!",
        date: "2026-01-20",
        views: 423,
        pinned: false,
        author: "Vindt Shop"
    }
];

// REVIEW BOARD DATA
const REVIEWS = [
    {
        id: 1,
        productId: 1,
        productTitle: "Vintage Carhartt Canvas Jacket",
        title: "퀄리티 정말 좋아요!",
        content: "기대 이상의 상태입니다. 빈티지 특유의 느낌이 살아있으면서도 깔끔해요. 추천합니다!",
        rating: 5,
        date: "2026-02-04",
        author: "김**",
        images: [],
        verified: true,
        helpful: 12
    },
    {
        id: 2,
        productId: 3,
        productTitle: "1980s Levi's 501 Denim",
        title: "사이즈 확인 꼭 하세요",
        content: "생각보다 크게 나왔어요. 하지만 상품 자체는 정말 만족스럽습니다. 빈티지 특유의 색감이 예뻐요.",
        rating: 4,
        date: "2026-02-03",
        author: "이**",
        images: [],
        verified: true,
        helpful: 8
    },
    {
        id: 3,
        productId: 5,
        productTitle: "90s Nike Windbreaker",
        title: "완벽해요!",
        content: "배송도 빠르고 상품 상태도 정말 좋습니다. 90년대 감성 그대로네요. 재구매 의사 100%!",
        rating: 5,
        date: "2026-02-02",
        author: "박**",
        images: [],
        verified: true,
        helpful: 15
    },
    {
        id: 4,
        productId: 7,
        productTitle: "Vintage Champion Reverse Weave",
        title: "겨울에 딱 좋아요",
        content: "두께감이 있어서 따뜻하고 핏도 예쁩니다. 빈티지 챔피온 찾으시는 분들께 강추!",
        rating: 5,
        date: "2026-02-01",
        author: "최**",
        images: [],
        verified: true,
        helpful: 9
    },
    {
        id: 5,
        productId: 2,
        productTitle: "Ralph Lauren Oxford Shirt",
        content: "클래식한 디자인이 마음에 들어요. 상태도 좋고 가격대비 만족스럽습니다.",
        rating: 4,
        date: "2026-01-31",
        author: "정**",
        images: [],
        verified: true,
        helpful: 6
    }
];

// Q&A BOARD DATA
const QNA = [
    {
        id: 1,
        productId: 1,
        productTitle: "Vintage Carhartt Canvas Jacket",
        question: "실측 사이즈 알 수 있을까요?",
        answer: "안녕하세요. 어깨 52cm, 가슴 60cm, 총장 70cm입니다. 감사합니다!",
        date: "2026-02-05",
        answerDate: "2026-02-05",
        author: "신**",
        status: "답변완료",
        secret: false
    },
    {
        id: 2,
        productId: 4,
        productTitle: "Vintage Patagonia Fleece",
        question: "색상이 사진과 동일한가요?",
        answer: "네, 실물과 사진이 거의 동일합니다. 다만 조명에 따라 약간의 차이가 있을 수 있습니다.",
        date: "2026-02-04",
        answerDate: "2026-02-04",
        author: "조**",
        status: "답변완료",
        secret: false
    },
    {
        id: 3,
        productId: 6,
        productTitle: "1970s Floral Maxi Dress",
        question: "세탁은 어떻게 하나요?",
        answer: "드라이클리닝을 권장드립니다. 손세탁도 가능하지만 찬물에 중성세제 사용해주세요.",
        date: "2026-02-03",
        answerDate: "2026-02-04",
        author: "강**",
        status: "답변완료",
        secret: false
    },
    {
        id: 4,
        productId: null,
        productTitle: "일반문의",
        question: "해외 배송 가능한가요?",
        answer: null,
        date: "2026-02-05",
        answerDate: null,
        author: "김**",
        status: "답변대기",
        secret: false
    },
    {
        id: 5,
        productId: 8,
        productTitle: "Vintage Burberry Trench Coat",
        question: "비밀글입니다.",
        answer: "비밀글입니다.",
        date: "2026-02-04",
        answerDate: "2026-02-04",
        author: "윤**",
        status: "답변완료",
        secret: true
    }
];

// BOARD TYPES
const BOARD_TYPES = {
    NOTICE: 'notice',
    REVIEW: 'review',
    QNA: 'qna'
};

// Helper function to get board data
function getBoardData(type) {
    switch (type) {
        case BOARD_TYPES.NOTICE:
            return NOTICES;
        case BOARD_TYPES.REVIEW:
            return REVIEWS;
        case BOARD_TYPES.QNA:
            return QNA;
        default:
            return [];
    }
}

// Helper function to get single item
function getBoardItem(type, id) {
    const data = getBoardData(type);
    return data.find(item => item.id === id);
}

// Expose to window for module access
window.NOTICES = NOTICES;
window.REVIEWS = REVIEWS;
window.QNA = QNA;
// Functions are already hoisted but let's be explicit if needed, though function declarations in global scope are window properties.
