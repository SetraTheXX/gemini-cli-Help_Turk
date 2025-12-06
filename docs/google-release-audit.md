# Google Release Audit (Turkish Fork)

Bu rapor, Gemini CLI Türkçe forkunun Google yayımlama hazır olup olmadığını değerlendirmek için yapılan hızlı incelemenin özetidir.

## Yerelleştirme
- Çökme banner'ı, DNS/bellek log uyarıları `uiTranslator` ile tamamen yerelleştirilmiş: `ui.crash.*`, `logs.dns.*`, `logs.memory.*` anahtarları kullanılıyor. Kaynak: `packages/cli/src/gemini.tsx`.
- Kimlik doğrulama hataları dinamik çeviri anahtarlarıyla oluşturuluyor (`auth.loginFailed`, `auth.invalidDefaultAuthType`). Kaynak: `packages/cli/src/ui/auth/useAuth.ts`.
- Güncelleme denetimi ve stdin uyarıları çeviri altyapısıyla besleniyor. Kaynaklar: `packages/cli/src/ui/utils/updateCheck.ts`, `packages/cli/src/utils/readStdin.ts`.

## Mimari & Güvenlik
- `@google/gemini-cli-core` bağımlılığı sabit sürümle kilitlenmiş (önek yok): `packages/cli/package.json`.
- Güvenlik otomasyonları mevcut: CodeQL iş akışı (`.github/workflows/codeql.yml`), CI'da `npm ci` ve üretim denetimi için `npm run security-check --workspace @google/gemini-cli` adımları (`.github/workflows/ci.yml`).

## Operasyonel Hazırlık
- README rozetleri CI/E2E'yi içeriyor; CodeQL rozeti eksik. Kurulum talimatları ağırlıklı İngilizce, Türkçe adımlar sınırlı.

## Sonuç
- Yerelleştirme ve güvenlik kontrolleri olumlu görünüyor. Vitrin/hazırlık tarafında (README rozetleri ve Türkçe kurulum akışı) iyileştirme gerekiyor.
