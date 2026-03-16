# Asset Generation Scripts

Bu klasor oyundaki tum gorsel ve ses asset'lerini uretmek icin kullanilan Python scriptlerini icerir.
Hicbiri runtime'da calismaz — sadece development sirasinda asset uretmek icin kullanilir.

## Gereksinimler

```bash
pip install Pillow   # gorsel scriptler icin
# Ses scriptleri pure Python (wave, struct) — ekstra paket gerekmez
```

## Scriptler

### Gorsel Asset'ler

| Script | Aciklama | Cikti |
|--------|----------|-------|
| `generate_assets.py` | **MVP ilk asset'ler** — basit yer dokularini, leke placeholder'larini, alet ikonlarini ve UI elemanlarini uretir | `assets/environment/`, `assets/stains/`, `assets/tools/` |
| `generate_stains_v2.py` | **Yuksek kalite leke asset'leri** (256x256) — kan, cam, cop, kanit, mobilya lekeleri. Katmanli dokular, damla efektleri, parlaklik | `assets/stains/` |
| `generate_environments_v2.py` | **Ortam doku asset'leri** — her ortam (daire, depo, ofis) icin zemin ve duvar texture'lari. Tahta desen, beton, karo | `assets/environment/{apartment,warehouse,office}/` |
| `generate_phase2_assets.py` | **Phase 2 ek asset'ler** — yeni leke turleri (cop, kanit, kirik mobilya) ve alet ikonlari | `assets/stains/`, `assets/tools/` |
| `generate_logo.py` | **Oyun logosu** — parmak izi siliniyor efektli logo, acid green/electric blue renk paleti | `assets/images/logo.png` |

### Ses Asset'leri

| Script | Aciklama | Cikti |
|--------|----------|-------|
| `generate_audio.py` | **Tum SFX + muzik** — wave sentezi ile scrub, stain-clean, combo-up, tool-switch, button-tap, level-complete/fail, star-earned, timer-warning sesleri + ortam muzikleri | `assets/sounds/`, `assets/music/` |
| `generate_music_v2.py` | **Gelistirilmis ortam muzikleri** — her ortam icin farkli tarzdda loop muzik (daire: gerilimli, depo: endustriyel, ofis: minimal) | `assets/music/` |
| `generate_reject_sound.py` | **Yanlis alet geri bildirim sesi** — kisa buzz efekti (150ms), yanlis alet kullanildiginda caliniyor | `assets/sounds/reject.wav` |

## Kullanim

Proje kokunden calistir:

```bash
python scripts/generate_assets.py          # MVP base asset'ler
python scripts/generate_stains_v2.py       # HD lekeler (uzerine yazar)
python scripts/generate_environments_v2.py # HD ortam texture'lari (uzerine yazar)
python scripts/generate_phase2_assets.py   # Phase 2 ek asset'ler
python scripts/generate_logo.py            # Logo
python scripts/generate_audio.py           # Tum sesler + muzik
python scripts/generate_music_v2.py        # Gelistirilmis muzikler (uzerine yazar)
python scripts/generate_reject_sound.py    # Reject SFX
```

> **Not:** v2 scriptleri onceki versiyonlarin uzerine yazar. Sira onemli — once base, sonra v2 calistir.
