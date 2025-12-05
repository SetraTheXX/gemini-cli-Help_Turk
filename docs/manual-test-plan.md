# Manual Test Plan (TR/EN Locale Stress)

Bu plan, Gemini CLI'nin (packages/cli) tam yerelleştirilmiş sürümünü gerçek kullanıcı koşullarında sınamak için hazırlanmıştır. Tüm adımlar terminalden çalıştırılabilir ve her birinin beklenen sonucu belirtilmiştir. Gerekirse komutları farklı terminallerde (bash/zsh/PowerShell) uygulayarak locale çözümlenmesinin tutarlılığını gözlemleyin.

## 1) Smoke Test – Mutlu Yol (Happy Path)
- [ ] Komut: `npm ci && npm run build`
  - Beklenen: Kurulum ve build hatasız tamamlanır; artefact'lar oluşturulur.
- [ ] Komut: `npm run start -- --help` **veya** `./packages/cli/dist/cli.js --help`
  - Beklenen: Tüm komut açıklamaları Türkçe, hizalama bozulmamış.
- [ ] Komut: `gemini login`
  - Beklenen: Yetkilendirme akışı Türkçe yönergelerle tamamlanır; token kaydedilir.
- [ ] Komut: `gemini chat`
  - Beklenen: Sohbet prompt'u Türkçe açılır, yanıtlar alınır.
- [ ] Komut: `gemini history list`
  - Beklenen: Önceki oturumlar Türkçe sütun başlıklarıyla listelenir.
- [ ] Komut: `gemini history clear`
  - Beklenen: Silme onayı ve başarı mesajı Türkçe gösterilir.
- [ ] Komut: `gemini logout`
  - Beklenen: Oturum kapatma bildirimi Türkçe, ek koruyucu mesaj görülmez.

## 2) L10N & I18N Stres Testi (Dinamik Locale)
- [ ] Komut: `LC_ALL=tr_TR.UTF-8 gemini --help`
  - Beklenen: Çıktı tamamen Türkçe.
- [ ] Komut: `LC_ALL=en_US.UTF-8 gemini --help`
  - Beklenen: Çıktı İngilizce; önceki dil kalıntısı yok.
- [ ] Komut: `LC_ALL=ja_JP.UTF-8 gemini --help`
  - Beklenen: Program çökmüyor; uyarı düşüp İngilizceye güvenli geri dönüş yapıyor.
- [ ] Komut: `LC_ALL=tr_TR.UTF-8 gemini chat` sırasında yeni terminalde `LC_ALL=en_US.UTF-8 gemini chat`
  - Beklenen: Paralel oturumlarda dil bağlamı doğru, metinler karışmıyor.

## 3) Negative Testing (Hata Yönetimi)
- [ ] Komut: Ağ bağlantısını kesin, ardından `gemini chat`
  - Beklenen: Türkçe, anlamlı ağ/bağlantı hatası; stack trace yok.
- [ ] Komut: `gemini abrakadabra`
  - Beklenen: Türkçe "bilinmeyen komut" hatası ve help özetine yönlendirme.
- [ ] Komut: `GEMINI_API_KEY=yanlis gemini chat`
  - Beklenen: Türkçe kimlik doğrulama hatası, rehberlik mesajı.
- [ ] Komut: `.config/gemini/config.json` dosyasını bilerek bozuk hale getirip `gemini chat`
  - Beklenen: Türkçe yapılandırma/parse hatası, güvenli çıkış.
- [ ] Komut: `LC_ALL=foo gemini chat`
  - Beklenen: Uyarı logu ve İngilizceye düşüş, crash yok.

## 4) UI/UX Görsel Kontrol
- [ ] Komut: `gemini --help`
  - Beklenen: Tablo hizası düzgün, Türkçe metinler sarmadan okunabilir.
- [ ] Komut: `gemini chat` açılışında spinner'ı gözlemle
  - Beklenen: "Witty" yükleme sözleri Türkçe döner; karakter bozulması yok.
- [ ] Komut: Crash tetikleyen bir deneme (varsa bilinçli throw) ile hata banner'ını görüntüle
  - Beklenen: Crash banner Türkçe başlık ve hata gövdesiyle çıkar.
- [ ] Komut: `gemini mcp list` (mevcutsa)
  - Beklenen: MCP komutları ve açıklamaları Türkçe, ikon/sütun hizası bozulmamış.
- [ ] Komut: Terminal genişliğini daraltıp `gemini --help`
  - Beklenen: Satır kayması olsa da metinler kırpılmadan okunabilir, UI bozulmaz.

## 5) Regresyon & Konfigürasyon
- [ ] Komut: `npm test -- --runInBand`
  - Beklenen: Tüm testler geçer; i18n snapshot'larında dil kayması yok.
- [ ] Komut: `npm run lint`
  - Beklenen: Lint hatası yok; i18n import'ları kurallara uygun.
- [ ] Komut: `npm audit --production`
  - Beklenen: Kritik/zafiyet raporu yok; varsa not edilip bloklanır.
- [ ] Komut: Farklı shell'lerde (bash/zsh) `gemini --help`
  - Beklenen: Locale çözümlemesi tutarlı.
- [ ] Komut (PowerShell): `set LC_ALL=tr_TR.UTF-8; gemini --help`
  - Beklenen: Locale fallback mantığı çalışır; komut satırı metinleri bozulmaz.

> Not: Bu plan manuel doğrulama içindir. Gerekli durumlarda log'lar (`~/.config/gemini/logs` veya proje içi debug çıktıları) toplanarak hata analizinde kullanılmalıdır.
