# Gemini CLI (Türkçe Sürüm)

[![CI](https://github.com/SetraTheXX/gemini-cli-Help_Turk/actions/workflows/ci.yml/badge.svg)](https://github.com/SetraTheXX/gemini-cli-Help_Turk/actions/workflows/ci.yml)
[![CodeQL](https://github.com/SetraTheXX/gemini-cli-Help_Turk/actions/workflows/codeql.yml/badge.svg)](https://github.com/SetraTheXX/gemini-cli-Help_Turk/actions/workflows/codeql.yml)
[![License](https://img.shields.io/github/license/SetraTheXX/gemini-cli-Help_Turk)](../../LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Language](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red)

Google Gemini CLI'nin Türkçe'ye tam uyarlanmış sürümüdür. Komut satırı deneyimi, yükleme mesajları, hata çıktıları ve crash ekranları dahil tamamı yerelleştirilmiş, kurumsal güvenlik ve dağıtım süreçleriyle uyumlu hale getirilmiştir.

## İçindekiler
- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Neden Core Sürümü Sabitlendi?](#neden-core-sürümü-sabitlendi)
- [Güvenlik Önlemleri](#güvenlik-önlemleri)
- [Katkılar ve Lisans](#katkılar-ve-lisans)

## Özellikler
- 🇹🇷 **Tam Türkçe Arayüz**: UI, komut çıktıları, hata mesajları, witty yükleme metinleri ve sistem logları çeviri katmanlarından beslenir.
- 🛡️ **Kurumsal Güvenlik**: Bağımlılıklar pinlenmiştir; CI'da `npm ci`, `npm run security-check` ve CodeQL adımları zorunludur.
- 🚀 **Dinamik Dil Algılama**: `LC_ALL`/`LANG` ortam değişkenlerinden dili saptar; desteklenmeyen durumlarda güvenle İngilizceye döner.
- 🧭 **Yalıtılmış Mimari**: Çekirdek paket sürümü sabitlenir; build sırasında core referansları izole edilerek kararlılık sağlanır.

## Kurulum
Aşağıdaki adımlar geliştirici ortamı ve global kurulum için önerilir:

```bash
# Depoyu klonlayın
git clone https://github.com/SetraTheXX/gemini-cli-Help_Turk.git
cd gemini-cli-Help_Turk/packages/cli

# Temiz ve deterministik bağımlılık kurulumu
npm ci

# Derleme
npm run build

# Geliştirici ortamında global bağlantı
npm link
```

Sadece global kurulum yapmak isterseniz derlemeden sonra `npm install -g .` komutunu uygulayabilirsiniz.

## Kullanım
```bash
# Yardım menüsü
gemini --help

# Sohbet başlatma
gemini chat

# Sistem bilgisi ve sürüm
gemini --version
```

CLI, sistem dilini otomatik algılar; desteklenmeyen bir locale tespit edilirse güvenli şekilde İngilizceye geri döner.

## Neden Core Sürümü Sabitlendi?
`@google/gemini-cli-core` bağımlılığı sürpriz yükseltmelerle davranış değişmemesi için sabit sürümle pinlenmiştir. Bu sayede aynı CLI çıktıları ve protokol sözleşmeleri her ortamda tutarlı kalır; depolara yayılan bağımlılık drift'i engellenir.

## Güvenlik Önlemleri
- **Tedarik Zinciri Tarama**: CI iş akışları `npm run security-check` (npm audit) ve CodeQL'i otomatik çalıştırır.
- **Deterministik Kurulum**: `npm ci` kullanılır; lockfile harici bağımlılığa izin verilmez.
- **İzolasyon**: Build adımları çekirdeğe gereksiz referansları temizleyerek çalışma zamanında saldırı yüzeyini azaltır.

## Katkılar ve Lisans
Katkılar PR ve issue şablonları üzerinden memnuniyetle karşılanır. Lisans: [Apache 2.0](../../LICENSE).
