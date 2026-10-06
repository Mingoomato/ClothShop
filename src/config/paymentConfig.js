// Client-side payment/login configuration.
// A Kakao JavaScript key is public, but token exchange and session creation
// belong on a trusted server. Keep the client flow disabled until that
// callback exists; never put a Kakao REST key or client secret here.
export const paymentConfig = {
    kakao: {
        enabled: false,
        jsKey: "KAKAO_JS_KEY_NOT_CONFIGURED",
        // This must be a server-side callback that validates state/code and
        // creates the application session before redirecting back to the shop.
        redirectUri: ""
    }
};
