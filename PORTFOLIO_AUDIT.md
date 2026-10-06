# Portfolio Audit

| Repository | Problem | Severity | Proposed change | Reason | Verification method |
|---|---|---|---|---|---|
| ClothShop | Firebase rules hard-code a personal email for admin authorization | P0 | Use a custom admin claim while retaining deny-by-default writes | Removes personal data and makes authorization maintainable without broadening access | Rules inspection and Firebase Rules syntax check if available |
| ClothShop | Browser code exchanges Kakao authorization codes and stores access tokens in localStorage | P0 | Use the supported Kakao SDK flow and keep app code from persisting provider tokens | Reduces token exposure and removes the unsafe client-side exchange | Static search for token persistence/exchange and syntax checks |
| ClothShop | Database-controlled values reach `innerHTML` templates | P1 | Escape untrusted values at HTML sinks and retain static markup behavior | Prevents stored/reflected XSS from product or board data | Sink audit and JavaScript syntax checks |
| ClothShop | Production paths contain unnecessary debug logging | P2 | Remove or reduce debug logs without changing error handling | Keeps public code focused and avoids leaking session data | Search production sources and syntax checks |
