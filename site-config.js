window.SPORTS_VIBE_CONFIG = {
  share: {
    // 카카오톡에서 버튼 한 번으로 직접 공유하려면 Kakao Developers의 JavaScript 키를 입력하세요.
    // 비워두어도 모바일에서는 운영체제 공유창을 통해 카카오톡/인스타그램 등으로 공유할 수 있습니다.
    kakaoJavaScriptKey: "",
    siteUrl: "https://sportsviblee.kr/"
  },
  comments: {
    provider: "supabase",
    supabase: {
      url: "https://fyxulzbmgqiunxowsfsi.supabase.co",
      publishableKey: "sb_publishable_P0H6Ce5_7Z3ZEND36_cZTw_2SOjTVCU",
      table: "comments"
    }
  }
};
