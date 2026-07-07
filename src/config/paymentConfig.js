// Client-side login/payment configuration.
// The Kakao JavaScript key is a public, domain-restricted identifier.
// Kakao login is not yet configured — set a real key from
// https://developers.kakao.com to enable it.
export const paymentConfig = {
    kakao: {
        jsKey: "KAKAO_JS_KEY_NOT_CONFIGURED",
        redirectUri: window.location.origin + "/"
    }
};
