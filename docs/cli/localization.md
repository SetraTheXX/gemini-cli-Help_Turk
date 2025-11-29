# CLI'yi Türkçe Çalıştırma

Gemini CLI artık yerelleştirilebilir yardım metinleri sunuyor. `--locale` bayrağı
veya sistem dil ayarlarınız sayesinde `gemini --help` çıktısını Türkçe olarak
görebilirsiniz.

## Locale Seçeneği

- `gemini --locale tr --help` komutu, yardım başlıklarını ve seçenek
  açıklamalarını Türkçe gösterir.
- Locale değeri `en` veya `tr` olabilir. Sağlanmazsa, önce `GEMINI_CLI_LOCALE`,
  ardından `LC_ALL`, `LANG` ve `LC_CTYPE` ortam değişkenleri okunur; eşleşme
  bulunamazsa varsayılan `en` kullanılır.

## Varsayılan Davranış

- Sistem locale'iniz Türkçe (`LANG=tr_TR.UTF-8` gibi) ise ek bir bayrak
  göndermeden yardım çıktısı Türkçe gelir.
- Başka bir dilde çalışıyorsanız `--locale tr` ile yalnızca yardım ve komut
  açıklamalarını Türkçeye çevirebilirsiniz; komut çalışması etkilenmez.

## Nasıl Katkı Yapılır?

- Yeni veya güncellenmiş çeviriler için `packages/cli/src/config/localization.ts`
  dosyasındaki `TRANSLATIONS` haritasına ilgili metinleri ekleyin veya iyileştirin.
- PR gönderirken, `npm run test --workspace @google/gemini-cli -- config.test.ts`
  komutu ile locale testlerinin geçtiğini doğrulayın.
