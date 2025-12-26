"use client";

import Script from "next/script";
import { initKakao } from "@/lib/kakao";

export function KakaoProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
        crossOrigin="anonymous"
        onLoad={() => {
          initKakao();
        }}
      />
      {children}
    </>
  );
}
