# Gemini CLI (Türkçe Sürüm)

[![CI](https://github.com/SetraTheXX/gemini-cli-Help_Turk/actions/workflows/ci.yml/badge.svg)](https://github.com/SetraTheXX/gemini-cli-Help_Turk/actions/workflows/ci.yml)
[![CodeQL](https://github.com/SetraTheXX/gemini-cli-Help_Turk/actions/workflows/codeql.yml/badge.svg)](https://github.com/SetraTheXX/gemini-cli-Help_Turk/actions/workflows/codeql.yml)
[![License](https://img.shields.io/github/license/SetraTheXX/gemini-cli-Help_Turk)](../../LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## Giriş
Bu depo, Google Gemini CLI'nin tamamen Türkçeleştirilmiş bir forkudur. Komut satırı deneyimi, yükleme cümleleri, loglar, hata mesajları ve crash banner'lar dahil %100 Türkçedir. Sistem dili ne olursa olsun otomatik algılar ve Türkçe/İngilizce arasında güvenli şekilde geçiş yapar.

## Özellikler
- 🇹🇷 **Tam Türkçe Arayüz**: UI, komut çıktıları, hata mesajları, witty yükleme metinleri ve sistem logları çeviri altyapısından gelir.
- 🛡️ **Kurumsal Güvenlik**: Bağımlılıklar pinlenmiştir; `npm ci` ve `npm run security-check` ile tedarik zinciri kontrolleri CI'da zorunlu kılınır.
- 🚀 **Dinamik Dil Algılama**: `LC_ALL`/`LANG` gibi ortam değişkenlerinden dili saptar, desteklenmeyen durumlarda İngilizceye güvenli biçimde döner.
- 🧭 **Yalıtılmış Mimari**: Çekirdek paket sürümü sabitlenir ve build sırasında core referansları izole edilerek kararlılık sağlanır.

## Kurulum
Globale kurulum veya geliştirme için aşağıdaki adımları kullanabilirsiniz:

```bash
# Depoyu klonlayın
git clone https://github.com/SetraTheXX/gemini-cli-Help_Turk.git
cd gemini-cli-Help_Turk/packages/cli

# Temiz bağımlılık kurulumu
npm ci

# Dağıtıma hazırlama
npm run build

# Global bağlantı (geliştirici ortamı)
npm link
```

Yalnızca global kurulum yapmak isterseniz build sonrası `npm install -g .` kullanabilirsiniz.

## Kullanım
```bash
# Yardım
gemini --help

# Sohbet başlatma
gemini chat

# Sistem bilgisi ve sürüm
gemini --version
```

Locale, sistem ortamına göre otomatik belirlenir; desteklenmeyen veya eksik tanımda CLI İngilizceye düşer.

## Mimari ve Güvenlik Notu
- **Sürüm Pinleme**: `@google/gemini-cli-core` sabit sürümle gelir; beklenmedik yükseltmeler engellenir.
- **İzolasyon**: Build konfigurasyonu, çekirdeğe gereksiz referansları kaldırarak CLI kodunu yalıtır.
- **CI Kapıları**: GitHub Actions, `npm ci`, lint, build, kapsamlı testler, `security-check` ve CodeQL taramasını otomatik çalıştırır.

## Katkılar ve Lisans
Bu proje Google'ın Gemini CLI çalışmasının Türkçe'ye uyarlanmış bir çatallamasıdır. Katkılar PR ve issue şablonları üzerinden memnuniyetle karşılanır. Lisans: [Apache 2.0](../../LICENSE).
