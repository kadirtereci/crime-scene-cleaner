# Crime Scene Cleaner — Story Mode + Scene-Based Levels

## Context

Oyunda su an 25 soyut level var (renkli daireler + tekrarlanan floor tile). Elimizde kullanilmayan guclu asset'ler var:
- `apartment/crime_scene_apartmant.png` — Daginik oda illustrasyonu (6MB)
- `apartment/clear_crime_scene_apartment.png` — Ayni odanin temiz hali (6MB)
- `mess_assets_named/` — 35 adet bireysel mess sprite (pizza kutusu, kirik bardak, sigara vs.)
- v2 GDD'de Episode yapisi, Hidden Clue System, Story Props vizyonu
- LEVEL_LIBRARY.md'de hazir senaryolar

**Amac:** Bu asset'leri kullanarak oyuna bir "Story Mode" eklemek. Gercek illustrasyonlu odalar, uzerine yerlestirilmis mess sprite'lar, temizlerken ortaya cikan gizli ipuclari, ve olay hikayesi.

---

## Oyun Yapisi: Iki Mod

### Classic Mode (mevcut — degismez)
- 25 soyut level, tekrarlanan floor texture, renkli daire stain'ler
- Arcade tarzi, hizli temizlik, yildiz/skor

### Story Mode (yeni — Main Menu'den ayri buton)
- Main Menu'de "Classic Mode" ve "Story Mode" butonlari yan yana
- Gercek illustrasyonlu oda arka plani (clean room image)
- Uzerinde yerlestirilmis mess sprite'lar (pizza kutusu, kirik cam, dokulen kahve vs.)
- Temizlerken bazi objelerin altindan **ipucu** cikiyor
- **Dedektif Modu**: Ipuclari birbirine bagli, episode sonunda "Olay Raporu" olusur
- Level sonu: gercek before/after illustrasyon + toplanan ipuclari
- Episode yapisi (her episode 3-5 level)
- **Ilk asamada sadece apartment** (elimizde hazir asset var). Calisinca office/warehouse eklenir

### Dedektif Modu — Ipucu Sistemi (Derin)
Her level'da 2-3 gizli ipucu var. Temizlerken objelerin altindan cikar. Ama ipuclari izole degil:

**Level ici:**
- Temizlenen objenin altindan ipucu belirir (golden glow + pulse)
- Oyuncu dokunarak toplar → kisa aciklama popup'i
- Toplanan ipuclari HUD'da kucuk ikon olarak birikir

**Episode sonu — Olay Raporu:**
- Episode'un tum level'larindaki ipuclari birbiriyle baglantili
- Tum ipuclari toplandiginda episode sonunda "Olay Raporu" ekrani acilir
- Rapor: ipuclarini birlestiren 3-5 cumlelik hikaye ("Parti sirasinda bir kavga cikti. Telefon kirildi, fotograf yirtildi. Ev sahibi gece yarisi ayrildi.")
- Kismi ipuclari: rapor parcali gosterilir (??? kisimlari eksik ipuclarla dolar)
- %100 ipucu bulan oyuncu "Detective" rozeti alir

**Veri yapisi:**
```typescript
EpisodeData {
  id, name, levels[],
  clueConnections: { clueIds → reportFragment },
  fullReport: string
}

ClueData {
  id, name, description, icon,
  position, episodeId,
  reportFragmentIndex  // hangi rapor parcasina bagli
}
```

---

## TODO Listesi (Oncelik Sirasiyla)

### 1. Veri Modeli (`src/game/types.ts`)
- [ ] `MessObjectData` tipi: spriteId, position, width/height, dirtLevel, cleanType, revealsClue?, toughness
- [ ] `ClueData` tipi: id, name, description, icon, position, collected, revealed
- [ ] `SceneBackground` tipi: cleanImage, messyImage
- [ ] `SceneLevelConfig` tipi: mode='scene', scene, messObjects[], clues[], episode
- [ ] `AnyLevelConfig` union type (ClassicLevelConfig | SceneLevelConfig)

### 2. Mess Sprite Registry (`src/game/messSprites.ts` — yeni dosya)
- [ ] 35 sprite icin require() map'i + default boyut + default cleanType
- [ ] cleanType mapping: sivilar→blood(mop), kirik→glass(scrubBrush), cop→trash(trashBag), mobilya→furniture(repairKit)

### 3. Temizlik Sistemi (`src/game/cleaningSystem.ts`)
- [ ] `rectDistance()` — dikdortgen hitbox mesafe hesabi (mess objeleri daire degil dikdortgen)
- [ ] `cleanMessTick()` — mess objeleri icin temizlik tick'i (cleanTick'in mess versiyonu)
- [ ] `calculateSceneProgress()` / `isSceneLevelComplete()`

### 4. MessObject Bileseni (`src/components/MessObject.tsx` — yeni dosya)
- [ ] Sprite PNG render (spriteId'den MESS_SPRITES lookup)
- [ ] dirtLevel'e gore opacity fade + scale shrink animasyonu
- [ ] Temizlenince pop/vanish animasyonu (Stain.tsx pattern'i)
- [ ] Temizlenince `revealsClue` varsa callback cagir
- [ ] isBeingScrubbed jitter animasyonu

### 5. GameScreen Branching (`src/screens/GameScreen.tsx`)
- [ ] `isSceneLevel` flag (levelConfig.mode === 'scene')
- [ ] Scene: clean room image background (resizeMode="cover", repeat yok)
- [ ] Scene: MessObject bilesenleri render (Stain yerine)
- [ ] Scene: cleanMessTick cagrisi (cleanTick yerine)
- [ ] Scene: clue reveal handling
- [ ] Classic: mevcut davranis aynen korunur

### 6. Hidden Clue System (`src/game/clueSystem.ts` — yeni dosya)
- [ ] ClueState yonetimi: createClueState, revealClue, collectClue
- [ ] RevealedClue bileseni (`src/components/RevealedClue.tsx`): golden glow pulse, tap-to-collect
- [ ] Clue toplama toast/popup animasyonu (isim + aciklama)
- [ ] HUD'da toplanan ipucu ikonlari (kucuk satir)
- [ ] LevelResult'a collectedClues ekleme

### 6b. Episode & Olay Raporu Sistemi (`src/game/episodeSystem.ts` — yeni dosya)
- [ ] `EpisodeData` tipi: id, name, levelIds[], clueConnections, fullReport
- [ ] Episode tanimlari (Episode 1: Apartment Chaos, 3-5 level)
- [ ] `buildIncidentReport(collectedClues, episode)` → rapor fragment'lari (bulunan + eksik)
- [ ] `IncidentReport` bileseni (`src/components/IncidentReport.tsx`): episode sonu ekrani
- [ ] Rapor parcalari: bulunan ipuclarina gore doldurulan cumleler, eksikler "???" olarak gosterilir
- [ ] "Detective" rozet sistemi (%100 ipucu → rozet)
- [ ] Episode select ekrani: episode listesi, kilitli/acik, ipucu progress bar, rozet

### 7. Scene Level Tanimlari (`src/game/sceneLevels.ts` — yeni dosya)
- [ ] Ilk scene level: "Pizza Party Disaster" (apartment, 6-8 mess objesi, 2-3 ipucu)
- [ ] Level library'den ek seviyeler (Neighbor Complaint, Late Night Study vs.)
- [ ] resolveMessObjects() helper (ratio→pixel donusumu)

### 8. Before/After Gercek Gorseller (`src/components/BeforeAfterReveal.tsx`)
- [ ] Scene mode: crime_scene_apartmant.png vs clear_crime_scene_apartment.png karsilastirmasi
- [ ] Messy image lazy-load (sadece ResultScreen'de)
- [ ] Classic mode: mevcut soyut daire davranisi korunur

### 9. ResultScreen Guncellemeleri (`src/components/ResultScreen.tsx`)
- [ ] "Clues Found: 2/3" stat satiri
- [ ] Toplanan ipucu ikonlari gosterimi
- [ ] Scene images'i BeforeAfterReveal'a pas
- [ ] Hikaye ozeti popup (tum ipuclari bulununca)

### 10. Progress & Navigation
- [ ] `PlayerProgress`'e collectedClues + episodeProgress ekleme + migration
- [ ] Main Menu'ye Story Mode butonu (Classic yanina)
- [ ] Story Mode episode select ekrani: episode kartlari, kilit durumu, ipucu/rozet progress
- [ ] Episode ici level select: level listesi, yildizlar, ipucu ikonlari
- [ ] Episode tamamlama ekrani: Olay Raporu gosterimi
- [ ] "Detective" rozet animasyonu (%100 ipuclari bulunca)

### 11. Asset Optimizasyonu
- [ ] 6MB room PNG → build-time JPEG/WebP sikistirma (~300-500KB)
- [ ] Gameplay'de sadece clean image yukle, messy image lazy-load
- [ ] expo-image kullanimi (daha iyi memory management)
- [ ] Diger environment'lar icin room gorselleri uretme (office, warehouse)

---

## Teknik Kararlar

| Konu | Karar |
|------|-------|
| Hitbox | Mess objeleri dikdortgen hitbox (`rectDistance`), stain'ler daire |
| cleanType | MessObjectData mevcut StainType kullanir → TOOL_STAIN_MAP uyumlu |
| Iki mod birlikte | `AnyLevelConfig` union type, GameScreen'de `isSceneLevel` branch |
| Bellek | Clean image gameplay'de, messy image sadece result'ta. Build-time sikistirma |
| Clue gesture | Pan gesture (temizlik) + ayri TouchableOpacity (ipucu toplama) |
| Level ID | Scene level'lar 101+ ID (classic ile cakismaz) |
| Aspect ratio | Room image square (1024x1024), telefon 9:19 → `resizeMode="cover"` + crop |

---

## Dogrulama

1. Classic mode'un hicbir davranisi degismemeli (mevcut 25 level aynen calisir)
2. Scene level'da mess objeleri dogru tool ile temizlenebilmeli
3. Temizlenen objenin altindan ipucu dogru sekilde cikmali
4. Before/After'da gercek room gorselleri gosterilmeli
5. 6MB image'lar memory crash yapmadan yuklenmeli
6. `npx expo start` ile hem classic hem scene level test edilmeli

---

## Kararlar (Onaylandi)

- **Erisim**: Main Menu'den bastan ayri buton (Classic | Story)
- **Asset kapsami**: Sadece apartment ile basla, calisinca digerlerini ekle
- **Ipucu derinligi**: Derin dedektif modu — ipuclari birbirine bagli, episode sonu olay raporu

## Kalan Acik Sorular

1. **Mess sprite boyutlari**: 35 sprite var ama hepsi ayni resolution mi? Oyundaki boyutlari nasil belirleyelim?
2. **Episode kilitleme**: Onceki episode'u bitir → sonraki acilsin mi, yoksa hepsi acik mi?
3. **Olay Raporu icerigi**: Hikaye metinlerini kim yazacak? (Biz mi uretelim, sen mi saglayacaksin?)
