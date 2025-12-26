/**
 * 카카오 SDK 유틸리티
 */

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

interface KakaoShareOptions {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

// 카카오 SDK 초기화
export function initKakao() {
  if (typeof window === "undefined") return;

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!kakaoKey) {
    console.warn("카카오 JavaScript 키가 설정되지 않았습니다.");
    return;
  }

  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(kakaoKey);
  }
}

// 카카오톡 공유
export function shareKakao(options: {
  title: string;
  description: string;
  imageUrl?: string;
  pageUrl: string;
  buttonText?: string;
}) {
  if (typeof window === "undefined" || !window.Kakao) {
    alert("카카오톡 공유를 사용할 수 없습니다.");
    return;
  }

  if (!window.Kakao.isInitialized()) {
    initKakao();
  }

  const defaultImage = `${window.location.origin}/og-default.png`;

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: options.title,
      description: options.description,
      imageUrl: options.imageUrl || defaultImage,
      link: {
        mobileWebUrl: options.pageUrl,
        webUrl: options.pageUrl,
      },
    },
    buttons: [
      {
        title: options.buttonText || "결과 보기",
        link: {
          mobileWebUrl: options.pageUrl,
          webUrl: options.pageUrl,
        },
      },
    ],
  });
}
