/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPPORTED_LOCALES = ['en', 'tr'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

interface CliTranslationStrings {
  usage: string;
  commandDescription: string;
  queryDescription: string;
  options: Record<string, string>;
}

const TRANSLATIONS: Record<SupportedLocale, CliTranslationStrings> = {
  en: {
    usage:
      'Usage: gemini [options] [command]\n\nGemini CLI - Launch an interactive CLI, use -p/--prompt for non-interactive mode',
    commandDescription: 'Launch Gemini CLI',
    queryDescription:
      'Positional prompt. Defaults to one-shot; use -i/--prompt-interactive for interactive.',
    options: {
      debug: 'Run in debug mode?',
      model: 'Model',
      prompt: 'Prompt. Appended to input on stdin (if any).',
      promptInteractive: 'Execute the provided prompt and continue in interactive mode',
      sandbox: 'Run in sandbox?',
      yolo:
        'Automatically accept all actions (aka YOLO mode, see https://www.youtube.com/watch?v=xvFZjo5PgG0 for more details)?',
      approvalMode:
        'Set the approval mode: default (prompt for approval), auto_edit (auto-approve edit tools), yolo (auto-approve all tools)',
      experimentalAcp: 'Starts the agent in ACP mode',
      allowedMcpServerNames: 'Allowed MCP server names',
      allowedTools: 'Tools that are allowed to run without confirmation',
      extensions:
        'A list of extensions to use. If not provided, all extensions are used.',
      listExtensions: 'List all available extensions and exit.',
      resume:
        'Resume a previous session. Use "latest" for most recent or index number (e.g. --resume 5)',
      listSessions: 'List available sessions for the current project and exit.',
      deleteSession:
        'Delete a session by index number (use --list-sessions to see available sessions).',
      includeDirectories:
        'Additional directories to include in the workspace (comma-separated or multiple --include-directories)',
      screenReader: 'Enable screen reader mode for accessibility.',
      outputFormat: 'The format of the CLI output.',
      fakeResponses: 'Path to a file with fake model responses for testing.',
      recordResponses: 'Path to a file to record model responses for testing.',
      locale: 'Locale to use for help and command descriptions (en or tr). Defaults to system locale.',
    },
  },
  tr: {
    usage:
      'Kullanım: gemini [seçenekler] [komut]\n\nGemini CLI - Etkileşimli CLI\'yi başlatır, etkileşimsiz mod için -p/--prompt kullanın',
    commandDescription: "Gemini CLI'yi başlat",
    queryDescription:
      'Pozisyonel istem. Varsayılan davranış tek seferliktir; etkileşimli mod için -i/--prompt-interactive kullanın.',
    options: {
      debug: 'Hata ayıklama modunda çalıştır?',
      model: 'Model',
      prompt: 'İstem. (Varsa) stdin girdisine eklenir.',
      promptInteractive: 'Verilen istemi çalıştır ve etkileşimli modda devam et',
      sandbox: 'Sandbox içinde çalıştır?',
      yolo:
        'Tüm eylemleri otomatik onayla (YOLO modu, ayrıntılar için https://www.youtube.com/watch?v=xvFZjo5PgG0).',
      approvalMode:
        'Onay modunu ayarla: default (onay iste), auto_edit (düzenleme araçlarını otomatik onayla), yolo (tüm araçları otomatik onayla)',
      experimentalAcp: 'Aracıyı ACP modunda başlatır',
      allowedMcpServerNames: 'İzin verilen MCP sunucu adları',
      allowedTools: 'Onay gerektirmeden çalışmasına izin verilen araçlar',
      extensions:
        'Kullanılacak uzantı listesi. Sağlanmazsa tüm uzantılar kullanılır.',
      listExtensions: 'Tüm kullanılabilir uzantıları listele ve çık.',
      resume:
        'Önceki bir oturumu devam ettir. En günceli için "latest" veya indeks numarası (örn. --resume 5) kullanın.',
      listSessions: 'Geçerli proje için oturumları listele ve çık.',
      deleteSession:
        'Oturumu indeks numarasıyla sil (--list-sessions ile mevcutları görebilirsiniz).',
      includeDirectories:
        'Çalışma alanına eklenecek ek dizinler (virgülle ayrılmış veya birden çok --include-directories).',
      screenReader: 'Erişilebilirlik için ekran okuyucu modunu aç.',
      outputFormat: 'CLI çıktısının formatı.',
      fakeResponses: 'Test için sahte model yanıtlarını içeren dosya yolu.',
      recordResponses: 'Model yanıtlarını kaydetmek için dosya yolu.',
      locale:
        'Yardım ve komut açıklamaları için dil (en veya tr). Varsayılan sistem yerel ayarıdır.',
    },
  },
};

function normalizeLocale(locale: string | undefined): SupportedLocale | undefined {
  if (!locale) {
    return undefined;
  }

  const normalized = locale.toLowerCase();
  const short = normalized.split(/[_\-.]/)[0];

  if (SUPPORTED_LOCALES.includes(short as SupportedLocale)) {
    return short as SupportedLocale;
  }

  return undefined;
}

function getLocaleFromArgv(rawArgv: string[]): string | undefined {
  for (let i = 0; i < rawArgv.length; i++) {
    const arg = rawArgv[i];
    if (arg.startsWith('--locale=')) {
      return arg.split('=')[1];
    }
    if (arg === '--locale' || arg === '-L') {
      return rawArgv[i + 1];
    }
  }
  return undefined;
}

export function resolveLocale(rawArgv: string[]): SupportedLocale {
  const localeFromArgv = normalizeLocale(getLocaleFromArgv(rawArgv));
  if (localeFromArgv) {
    return localeFromArgv;
  }

  const envLocale =
    process.env['GEMINI_CLI_LOCALE'] ||
    process.env['LC_ALL'] ||
    process.env['LANG'] ||
    process.env['LC_CTYPE'];
  const normalizedEnvLocale = normalizeLocale(envLocale);
  if (normalizedEnvLocale) {
    return normalizedEnvLocale;
  }

  return 'en';
}

export function getCliTranslations(locale: SupportedLocale): CliTranslationStrings {
  return TRANSLATIONS[locale] ?? TRANSLATIONS.en;
}
