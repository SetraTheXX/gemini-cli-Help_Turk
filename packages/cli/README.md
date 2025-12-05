# Gemini CLI (Turkish Localization Fork)

Bu dizin, Gemini CLI'nin Türkçe yerelleştirilmiş sürümünü içerir.

## 🏗️ Architecture & Localization Note

This fork uses an isolated build scope for localization stability. The dependency on @google/gemini-cli-core is explicitly pinned to prevent runtime type drift, ensuring the localized CLI remains stable independent of upstream minor updates.
